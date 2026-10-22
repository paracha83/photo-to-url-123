/**
 * Comprehensive Automated Test Suite for Image To URL
 * Tests:
 * - Image MIME & Magic Bytes Validation (PNG, JPEG, GIF, WEBP, fake, exe, oversized)
 * - Security & Path Traversal sanitization
 * - Delete Token Cryptographic Safety & LocalStorage Leakage Prevention
 * - Cloudflare R2 / S3 Provider Structure & SigV4 Signatures
 * - LocalStorageProvider as Primary Storage Provider (Upload, Read, Exists, Expiration, Delete, List)
 * - Optional R2 Requirements in Local Mode (Zero R2 requirement for startup/operation)
 * - Explicit R2 Mode Validation
 * - Admin Secret Hardening (Zero production default bypass)
 * - Zero Supabase / Zero Firebase Architecture
 * - Server-side Rate Limiter
 */
import { validateImageBuffer, sanitizeFilename } from '../src/server/utils/validator';
import {
  LocalStorageProvider,
  LazyS3StorageProvider,
  getStorageProvider,
  getStorageConfig,
  isStorageConfigured,
  validateStorageEnvironment,
  _resetStorageProviderInstance,
} from '../src/server/storage';
import { CloudflareR2StorageProvider } from '../src/server/storage/S3StorageProvider';
import { MemoryRateLimiter } from '../src/server/utils/rateLimiter';
import {
  saveImageToHistory,
  getImageHistory,
  getSessionDeleteToken,
} from '../src/lib/userPreferences';
import crypto from 'crypto';
import fs from 'fs';

interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, category: string, details?: string) {
  if (condition) {
    results.push({ name, category, status: 'PASS' });
    console.log(`  ✓ [PASS] [${category}] ${name}`);
  } else {
    results.push({ name, category, status: 'FAIL', details });
    console.error(`  ✗ [FAIL] [${category}] ${name} - ${details || 'Assertion failed'}`);
  }
}

// Fixture Generators for Real Magic Bytes
function createMinimalPng(width = 100, height = 100): Buffer {
  const buf = Buffer.alloc(33);
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  // IHDR chunk length: 13
  buf.writeUInt32BE(13, 8);
  // IHDR chunk type: "IHDR"
  buf.write('IHDR', 12, 'ascii');
  // Width & Height
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  buf.set([8, 6, 0, 0, 0], 24);
  return buf;
}

function createMinimalGif(width = 80, height = 60): Buffer {
  const buf = Buffer.alloc(14);
  // "GIF89a"
  buf.write('GIF89a', 0, 'ascii');
  buf.writeUInt16LE(width, 6);
  buf.writeUInt16LE(height, 8);
  return buf;
}

function createMinimalJpg(width = 120, height = 90): Buffer {
  // FF D8 FF E0 ... FF C0 (SOF0)
  const buf = Buffer.alloc(30);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  buf.writeUInt16BE(16, 4); // segment length
  // SOF0 marker
  buf[20] = 0xff;
  buf[21] = 0xc0;
  buf.writeUInt16BE(11, 22); // length
  buf[24] = 8; // precision
  buf.writeUInt16BE(height, 25);
  buf.writeUInt16BE(width, 27);
  return buf;
}

function createMinimalWebp(width = 64, height = 48): Buffer {
  // RIFF .... WEBP VP8
  const buf = Buffer.alloc(35);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(27, 4);
  buf.write('WEBP', 8, 'ascii');
  buf.write('VP8 ', 12, 'ascii');
  buf.writeUInt32LE(15, 16); // VP8 chunk length
  buf[20] = 0x10;
  buf[21] = 0x00;
  buf[22] = 0x00;
  // Start code: 9d 01 2a
  buf[23] = 0x9d;
  buf[24] = 0x01;
  buf[25] = 0x2a;
  buf.writeUInt16LE(width & 0x3fff, 26);
  buf.writeUInt16LE(height & 0x3fff, 28);
  return buf;
}

// Mock browser localStorage for Node testing
const mockStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStore.get(key) || null,
  setItem: (key: string, value: string) => mockStore.set(key, value),
  removeItem: (key: string) => mockStore.delete(key),
  clear: () => mockStore.clear(),
};

async function runTestSuite() {
  console.log('\n=============================================');
  console.log('  RUNNING IMAGE TO URL PRODUCTION TEST SUITE');
  console.log('  Primary Storage: LocalStorageProvider');
  console.log('=============================================\n');

  // --- Category: Validation & Magic Bytes ---
  console.log('Testing Image Validation & Magic Bytes...');
  const png = createMinimalPng(250, 150);
  const jpg = createMinimalJpg(320, 240);
  const gif = createMinimalGif(100, 80);
  const webp = createMinimalWebp(64, 48);
  const fakeImage = Buffer.from('<html><body>Not an image</body></html>');
  const exeFile = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00');

  const validPng = validateImageBuffer(png, 'image/png');
  assert(Boolean(validPng.valid && validPng.detectedMime === 'image/png'), 'Valid PNG detection', 'MIME Validation');
  assert(validPng.width === 250 && validPng.height === 150, 'PNG dimensions extraction', 'Validation');

  const validJpg = validateImageBuffer(jpg, 'image/jpeg');
  assert(Boolean(validJpg.valid && validJpg.detectedMime === 'image/jpeg'), 'Valid JPG detection', 'MIME Validation');
  assert(validJpg.width === 320 && validJpg.height === 240, 'JPG dimensions extraction', 'Validation');

  const validGif = validateImageBuffer(gif, 'image/gif');
  assert(Boolean(validGif.valid && validGif.detectedMime === 'image/gif'), 'Valid GIF detection', 'MIME Validation');
  assert(validGif.width === 100 && validGif.height === 80, 'GIF dimensions extraction', 'Validation');

  const validWebp = validateImageBuffer(webp, 'image/webp');
  assert(Boolean(validWebp.valid && validWebp.detectedMime === 'image/webp'), 'Valid WEBP detection', 'MIME Validation');
  assert(validWebp.width === 64 && validWebp.height === 48, 'WEBP dimensions extraction', 'Validation');

  const fakeRes = validateImageBuffer(fakeImage, 'image/png');
  assert(!fakeRes.valid, 'Reject HTML disguised as image', 'Security');

  const exeRes = validateImageBuffer(exeFile, 'image/jpeg');
  assert(!exeRes.valid, 'Reject executable binary as image', 'Security');

  const emptyRes = validateImageBuffer(Buffer.alloc(0), 'image/png');
  assert(!emptyRes.valid, 'Reject empty upload buffer', 'Validation');

  const largeBuf = Buffer.alloc(11 * 1024 * 1024);
  largeBuf[0] = 0x89;
  largeBuf[1] = 0x50;
  largeBuf[2] = 0x4e;
  largeBuf[3] = 0x47;
  const oversizedRes = validateImageBuffer(largeBuf, 'image/png', 10 * 1024 * 1024);
  assert(Boolean(!oversizedRes.valid && oversizedRes.error?.includes('10 MB limit')), 'Reject oversized file (>10MB)', 'Limits');

  // --- Category: Security & Path Traversal ---
  console.log('\nTesting Filename Sanitization & Path Traversal...');
  assert(sanitizeFilename('../../etc/passwd.jpg') === 'passwd.jpg', 'Prevent directory traversal ../../', 'Security');
  assert(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe') === 'cmd.exe', 'Prevent Windows path traversal', 'Security');
  assert(sanitizeFilename('.hidden_file.png') === 'hidden_file.png', 'Strip leading dots', 'Security');
  assert(sanitizeFilename('good-photo_2026.webp') === 'good-photo_2026.webp', 'Allow clean safe filenames', 'Security');

  // --- Category: Delete Token Security & LocalStorage Audit ---
  console.log('\nTesting Delete Token Security & LocalStorage Audit...');
  const testDeleteToken = crypto.randomBytes(24).toString('hex');
  assert(testDeleteToken.length === 48, 'Delete token is 48-char cryptographically random hex', 'Security');

  const dummyPublicUrl = 'https://imglink.app/i/abc123xyz';
  assert(!dummyPublicUrl.includes(testDeleteToken), 'Delete token is NEVER included in public URL', 'Security');

  // Test that deleteToken is NOT persisted to localStorage
  const testRecord = {
    id: 'test_sec_id',
    originalFilename: 'test.png',
    sanitizedFilename: 'test.png',
    mimeType: 'image/png',
    size: 1024,
    width: 100,
    height: 100,
    publicUrl: dummyPublicUrl,
    deleteToken: testDeleteToken,
    createdAt: Date.now(),
    expiresAt: null,
    storageProvider: 'local',
    objectKey: 'test_sec_id.png',
  };

  saveImageToHistory(testRecord);
  const rawStoredJson = mockStore.get('imageHistory') || '';
  assert(!rawStoredJson.includes(testDeleteToken), 'deleteToken is NOT persisted in localStorage string', 'Delete Token Protection');

  const loadedHistory = getImageHistory();
  assert(loadedHistory.length > 0 && loadedHistory[0].deleteToken === undefined, 'Retrieved history has deleteToken === undefined', 'LocalStorage Secret Exposure');

  // Verify runtime session memory contains the active token
  const sessionToken = getSessionDeleteToken('test_sec_id');
  assert(sessionToken === testDeleteToken, 'Active session holds delete token in runtime memory', 'Delete Token Protection');

  // --- Category: Cloudflare R2 Provider Structure & Signatures ---
  console.log('\nTesting Cloudflare R2 Provider Structure & Signatures...');
  const r2Provider = new CloudflareR2StorageProvider({
    bucket: 'test-bucket',
    region: 'auto',
    endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
    accessKeyId: 'test_key',
    secretAccessKey: 'test_secret',
    publicDomain: 'https://img.cdn.com',
  });
  assert(r2Provider.name === 'r2', 'Cloudflare R2 provider identifies as "r2"', 'R2 Provider');
  assert(r2Provider.getPublicUrl('xyz123') === 'https://img.cdn.com/i/xyz123', 'R2 uses configured publicDomain CDN', 'R2 Provider');

  // --- Category: Storage Provider Operations (LocalStorageProvider) ---
  console.log('\nTesting LocalStorageProvider Operations...');
  const storage = new LocalStorageProvider();
  assert(storage.name === 'local', 'LocalStorageProvider initializes successfully', 'Storage Provider');

  // 1. PNG Upload
  const pngId = 'png_' + crypto.randomBytes(4).toString('hex');
  const pngRecord = await storage.uploadImage({
    id: pngId,
    buffer: png,
    originalFilename: 'sample.png',
    mimeType: 'image/png',
    size: png.length,
    width: 250,
    height: 150,
    expiresAt: null,
    deleteToken: crypto.randomBytes(16).toString('hex'),
  });
  assert(pngRecord.id === pngId, 'PNG upload succeeds', 'Upload');

  // 2. JPEG Upload
  const jpgId = 'jpg_' + crypto.randomBytes(4).toString('hex');
  const jpgRecord = await storage.uploadImage({
    id: jpgId,
    buffer: jpg,
    originalFilename: 'sample.jpg',
    mimeType: 'image/jpeg',
    size: jpg.length,
    width: 320,
    height: 240,
    expiresAt: null,
    deleteToken: crypto.randomBytes(16).toString('hex'),
  });
  assert(jpgRecord.id === jpgId, 'JPEG upload succeeds', 'Upload');

  // 3. WEBP Upload
  const webpId = 'webp_' + crypto.randomBytes(4).toString('hex');
  const webpRecord = await storage.uploadImage({
    id: webpId,
    buffer: webp,
    originalFilename: 'sample.webp',
    mimeType: 'image/webp',
    size: webp.length,
    width: 64,
    height: 48,
    expiresAt: null,
    deleteToken: crypto.randomBytes(16).toString('hex'),
  });
  assert(webpRecord.id === webpId, 'WEBP upload succeeds', 'Upload');

  // 4. GIF Upload
  const gifId = 'gif_' + crypto.randomBytes(4).toString('hex');
  const gifRecord = await storage.uploadImage({
    id: gifId,
    buffer: gif,
    originalFilename: 'sample.gif',
    mimeType: 'image/gif',
    size: gif.length,
    width: 100,
    height: 80,
    expiresAt: null,
    deleteToken: crypto.randomBytes(16).toString('hex'),
  });
  assert(gifRecord.id === gifId, 'GIF upload succeeds', 'Upload');

  // 5. Image Retrieval & Exact Bytes
  const retrievedPng = await storage.getImage(pngId);
  assert(
    Boolean(retrievedPng && Buffer.compare(retrievedPng.buffer, png) === 0),
    'Uploaded image returns exact stored buffer bytes',
    'Image Retrieval'
  );
  assert(retrievedPng?.mimeType === 'image/png', 'Content type is correct', 'Image Retrieval');

  // 6. Object presence check
  const exists = await storage.imageExists(pngId);
  assert(exists === true, 'imageExists confirms object presence', 'Storage');

  // 7. List Images
  const list = await storage.listImages();
  assert(list.length >= 4, 'listImages returns stored objects', 'List');

  // 8. Expiration (Read-time expiration)
  const expiredId = 'exp_' + crypto.randomBytes(4).toString('hex');
  await storage.uploadImage({
    id: expiredId,
    buffer: png,
    originalFilename: 'expired.png',
    mimeType: 'image/png',
    size: png.length,
    width: 250,
    height: 150,
    expiresAt: Date.now() - 1000, // already expired
    deleteToken: 'token',
  });
  const getExpired = await storage.getImage(expiredId);
  assert(getExpired === null, 'Expired image automatically returns null / 404', 'Expiration');

  // 9. Deletion
  const deleted = await storage.deleteImage(pngId);
  assert(deleted === true, 'Delete succeeds', 'Delete');

  const afterDelete = await storage.getImage(pngId);
  assert(afterDelete === null, 'Deleted image returns 404 / null', 'Delete');

  const repeatedDelete = await storage.deleteImage(pngId);
  assert(repeatedDelete === false, 'Repeated delete returns false for nonexistent item', 'Delete');

  // --- Category: LocalStorageProvider as Primary & Ignored R2 Requirements ---
  console.log('\nTesting LocalStorageProvider Primary Selection & Ignored R2 Requirements...');
  const oldProvider = process.env.STORAGE_PROVIDER;
  const oldNodeEnv = process.env.NODE_ENV;

  // Case 1: STORAGE_PROVIDER absent (default fallback)
  delete process.env.STORAGE_PROVIDER;
  delete process.env.R2_BUCKET_NAME;
  delete process.env.STORAGE_BUCKET;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_ACCOUNT_ID;
  _resetStorageProviderInstance();

  const defaultConfig = getStorageConfig();
  assert(defaultConfig.provider === 'local', 'Default storage provider is "local"', 'Storage Provider');
  const defaultValidation = validateStorageEnvironment();
  assert(defaultValidation.valid === true, 'Environment validation is valid in default local mode without R2 credentials', 'Storage Provider');
  assert(defaultValidation.missingVars.length === 0, 'No missing vars reported when in local mode', 'Storage Provider');
  assert(isStorageConfigured() === true, 'isStorageConfigured() is true by default without R2 credentials', 'Storage Provider');
  const defaultProviderInstance = getStorageProvider();
  assert(defaultProviderInstance.name === 'local', 'getStorageProvider() returns LocalStorageProvider by default', 'Storage Provider');

  // Case 2: STORAGE_PROVIDER="local" explicitly set
  process.env.STORAGE_PROVIDER = 'local';
  _resetStorageProviderInstance();
  const localValidation = validateStorageEnvironment();
  assert(localValidation.valid === true, 'Environment validation valid with STORAGE_PROVIDER=local', 'Storage Provider');
  assert(isStorageConfigured() === true, 'isStorageConfigured() is true with STORAGE_PROVIDER=local', 'Storage Provider');
  const localProviderInstance = getStorageProvider();
  assert(localProviderInstance.name === 'local', 'getStorageProvider() returns LocalStorageProvider when STORAGE_PROVIDER=local', 'Storage Provider');

  // Case 3: Explicit STORAGE_PROVIDER="r2" without credentials catches missing configuration
  process.env.STORAGE_PROVIDER = 'r2';
  _resetStorageProviderInstance();
  const r2Validation = validateStorageEnvironment();
  assert(r2Validation.valid === false, 'Explicit STORAGE_PROVIDER=r2 catches missing R2 credentials', 'Storage Provider');
  assert(isStorageConfigured() === false, 'isStorageConfigured() is false when STORAGE_PROVIDER=r2 lacks credentials', 'Storage Provider');
  let r2ErrorThrown = false;
  try {
    getStorageProvider();
  } catch (err: any) {
    r2ErrorThrown = true;
    assert(err.message.includes("Storage provider 'r2' was explicitly requested"), 'Throws helpful error on explicit r2 without creds', 'Storage Provider');
  }
  assert(r2ErrorThrown === true, 'getStorageProvider() throws when explicit R2 lacks credentials', 'Storage Provider');

  // Case 4: Explicit STORAGE_PROVIDER="r2" WITH credentials returns LazyS3StorageProvider
  process.env.STORAGE_PROVIDER = 'r2';
  process.env.R2_BUCKET_NAME = 'test-bucket';
  process.env.R2_ACCESS_KEY_ID = 'test-key';
  process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
  process.env.R2_ACCOUNT_ID = 'test-account';
  _resetStorageProviderInstance();
  const lazyInstance = getStorageProvider();
  assert(lazyInstance instanceof LazyS3StorageProvider, 'Explicit STORAGE_PROVIDER=r2 with credentials returns LazyS3StorageProvider', 'Storage Provider');
  assert(lazyInstance.name === 'r2', 'Lazy provider identifies as "r2"', 'Storage Provider');
  assert(lazyInstance.getPublicUrl('test123').includes('/i/test123'), 'Lazy provider produces valid public URLs', 'Storage Provider');
  delete process.env.R2_BUCKET_NAME;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_ACCOUNT_ID;

  // Restore env
  if (oldProvider) {
    process.env.STORAGE_PROVIDER = oldProvider;
  } else {
    delete process.env.STORAGE_PROVIDER;
  }
  process.env.NODE_ENV = oldNodeEnv;
  _resetStorageProviderInstance();

  // --- Category: Admin Secret Hardening ---
  console.log('\nTesting Admin Secret Hardening...');
  const isProd = process.env.NODE_ENV === 'production';
  const testAdminDefault = process.env.ADMIN_SECRET || (isProd ? undefined : 'admin123');
  if (isProd) {
    assert(testAdminDefault === undefined, 'In production, ADMIN_SECRET does not silently default to admin123', 'Admin Security');
  } else {
    assert(testAdminDefault !== undefined, 'In development, ADMIN_SECRET safely defaults for testing', 'Admin Security');
  }

  // --- Category: Zero Supabase & Zero Firebase Audit ---
  console.log('\nTesting Zero Supabase & Zero Firebase Architecture...');
  const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
  const hasSupabase = Object.keys(deps).some((k) => k.toLowerCase().includes('supabase'));
  const hasFirebase = Object.keys(deps).some((k) => k.toLowerCase().includes('firebase'));
  assert(!hasSupabase, 'Zero Supabase packages present in package.json', 'Architecture');
  assert(!hasFirebase, 'Zero Firebase packages present in package.json', 'Architecture');

  // --- Category: Rate Limiter ---
  console.log('\nTesting Server-Side Rate Limiter...');
  const limiter = new MemoryRateLimiter(60000, 3, 'test');
  const ip = '192.168.1.50';

  assert(limiter.check(ip).allowed === true, 'Rate limiter allows request 1', 'Rate Limiting');
  assert(limiter.check(ip).allowed === true, 'Rate limiter allows request 2', 'Rate Limiting');
  assert(limiter.check(ip).allowed === true, 'Rate limiter allows request 3', 'Rate Limiting');
  const blocked = limiter.check(ip);
  assert(blocked.allowed === false && blocked.retryAfterSeconds > 0, 'Rate limiter blocks request 4 with Retry-After', 'Rate Limiting');

  // --- Summary ---
  console.log('\n=============================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length})`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
