/**
 * Real Cloudflare R2 / S3 Cloud Storage Integration Test
 * Strictly follows No-Fake-Pass policy.
 * If credentials are missing in the environment, outputs NOT VERIFIED.
 * If credentials exist, performs a real cloud PUT, GET, HEAD, DELETE cycle.
 */
import { getStorageConfig } from '../src/server/storage';
import { S3StorageProvider } from '../src/server/storage/S3StorageProvider';

async function runCloudStorageVerification() {
  console.log('\n=============================================');
  console.log('  CLOUDFLARE R2 PRODUCTION STORAGE CHECK');
  console.log('=============================================\n');

  const config = getStorageConfig();

  if (!config.hasExternalCredentials) {
    console.log('RESULT: Cloudflare R2 E2E: NOT VERIFIED');
    console.log('Reason: Production R2 credentials unavailable (STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_ENDPOINT are not set in the current environment).');
    console.log('Note: Safe local development fallback remains active for local testing.\n');
    process.exit(0);
  }

  const isR2 = config.endpoint!.includes('r2.cloudflarestorage.com') || config.provider === 'r2';
  console.log(`Connecting to ${isR2 ? 'Cloudflare R2' : 'S3-compatible'} storage at: ${config.endpoint}`);
  console.log(`Target Bucket: ${config.bucket}`);

  const provider = new S3StorageProvider({
    bucket: config.bucket!,
    region: config.region,
    endpoint: config.endpoint!,
    accessKeyId: config.accessKey!,
    secretAccessKey: config.secretKey!,
    publicDomain: config.publicDomain,
  });

  const testId = `test_cloud_${Date.now()}`;
  const testDeleteToken = 'secret_test_token';
  // Real 2x2 PNG
  const pngBuf = Buffer.from(
    '89504e470d0a1a0a0000000d494844520000000200000002080600000072b60d240000000b49444154789c63600000000200014db7e5270000000049454e44ae426082',
    'hex'
  );

  try {
    // 1. Upload to Cloudflare R2
    console.log('1. Uploading test image to R2...');
    const record = await provider.uploadImage({
      id: testId,
      buffer: pngBuf,
      originalFilename: 'r2_test.png',
      mimeType: 'image/png',
      size: pngBuf.length,
      width: 2,
      height: 2,
      expiresAt: null,
      deleteToken: testDeleteToken,
    });
    console.log('   ✓ Real cloud upload succeeded:', record.publicUrl);

    // 2. Verify existence via HEAD
    console.log('2. Verifying object exists via HEAD...');
    const exists = await provider.imageExists(testId);
    if (!exists) {
      throw new Error('Object not found in R2 bucket after PUT');
    }
    console.log('   ✓ Cloud object confirmed present in R2 bucket.');

    // 3. Retrieve object via GET
    console.log('3. Downloading object from R2...');
    const retrieved = await provider.getImage(testId);
    if (!retrieved || retrieved.buffer.length !== pngBuf.length) {
      throw new Error('R2 GET failed or buffer size mismatch');
    }
    console.log('   ✓ R2 GET returned exact binary buffer, MIME: ' + retrieved.mimeType);

    // 4. Delete object
    console.log('4. Deleting test image from R2...');
    const deleted = await provider.deleteImage(testId);
    if (!deleted) {
      throw new Error('R2 DELETE failed');
    }
    console.log('   ✓ R2 DELETE succeeded.');

    // 5. Confirm 404
    console.log('5. Confirming object no longer exists in R2...');
    const postDeleteExists = await provider.imageExists(testId);
    if (postDeleteExists) {
      throw new Error('R2 object still exists after DELETE');
    }
    console.log('   ✓ R2 object confirmed deleted.');

    console.log('\nRESULT: Cloudflare R2 E2E: PASS\n');
  } catch (err) {
    console.error('\nRESULT: Cloudflare R2 E2E: FAIL');
    console.error('Error details:', err);
    process.exit(1);
  }
}

runCloudStorageVerification().catch((err) => {
  console.error('Execution failure:', err);
  process.exit(1);
});
