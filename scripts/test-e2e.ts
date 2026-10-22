/**
 * Real End-to-End HTTP Integration Test for Image To URL
 * Tests real server routes, upload, retrieval, persistent list, headers, deletion, and 404 verification.
 */
import express from 'express';
import cors from 'cors';
import { apiRouter } from '../src/server/api';
import { imageResolverHandler } from '../src/server/imageResolver';

async function runE2ETests() {
  console.log('\n=============================================');
  console.log('  RUNNING REAL HTTP END-TO-END TEST');
  console.log('=============================================\n');

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use('/api', apiRouter);
  app.get('/i/:id', imageResolverHandler);

  const server = app.listen(3456);

  try {
    const baseUrl = 'http://localhost:3456';

    // 1. Health check
    console.log('1. Testing /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    if (healthRes.ok && healthData.status === 'ok') {
      console.log('   ✓ Health check passed, provider:', healthData.storageProvider);
    } else {
      throw new Error('Health check failed: ' + JSON.stringify(healthData));
    }

    // 2. Upload real PNG
    console.log('2. Testing POST /api/upload...');
    // Real minimal 2x2 PNG
    const pngHex = '89504e470d0a1a0a0000000d494844520000000200000002080600000072b60d240000000b49444154789c63600000000200014db7e5270000000049454e44ae426082';
    const pngBuf = Buffer.from(pngHex, 'hex');

    const formData = new FormData();
    formData.append('image', new Blob([pngBuf], { type: 'image/png' }), 'e2e_photo.png');
    formData.append('expiration', 'never');

    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.success) {
      throw new Error('Upload failed: ' + JSON.stringify(uploadData));
    }
    console.log('   ✓ Upload succeeded, ID:', uploadData.id);
    console.log('   ✓ Direct URL generated:', uploadData.url);
    console.log('   ✓ Delete token issued in upload response:', uploadData.deleteToken ? 'YES' : 'NO');

    const imageId = uploadData.id;
    const deleteToken = uploadData.deleteToken;

    // 3. Resolve direct image route GET /i/:id
    console.log(`3. Testing GET /i/${imageId}...`);
    const getRes = await fetch(`${baseUrl}/i/${imageId}`);
    if (!getRes.ok) {
      throw new Error(`Failed to resolve image /i/${imageId}: ${getRes.status}`);
    }
    const contentType = getRes.headers.get('content-type');
    const nosniff = getRes.headers.get('x-content-type-options');
    const imageBytes = await getRes.arrayBuffer();

    if (contentType !== 'image/png' || nosniff !== 'nosniff' || imageBytes.byteLength !== pngBuf.length) {
      throw new Error(`Headers or body mismatch. Content-Type=${contentType}, size=${imageBytes.byteLength}`);
    }
    if (getRes.headers.get('x-delete-token') || getRes.headers.get('delete-token')) {
      throw new Error('Security leak: delete token exposed in /i/:id headers');
    }
    console.log('   ✓ Direct image route returned status 200, image/png, nosniff, size matches original buffer.');

    // 4. Check metadata GET /api/images/:id
    console.log(`4. Testing GET /api/images/${imageId}...`);
    const metaRes = await fetch(`${baseUrl}/api/images/${imageId}`);
    const metaData = await metaRes.json();
    if (!metaRes.ok || !metaData.success || metaData.image.id !== imageId) {
      throw new Error('Failed to get metadata: ' + JSON.stringify(metaData));
    }
    if (metaData.image.deleteToken !== undefined) {
      throw new Error('Security leak: deleteToken exposed through GET /api/images/:id');
    }
    console.log('   ✓ Image metadata verified and deleteToken confirmed unexposed.');

    // 5. Test persistent list GET /api/images
    console.log('5. Testing GET /api/images (persistent storage listing)...');
    const listRes = await fetch(`${baseUrl}/api/images`);
    const listData = await listRes.json();
    if (!listRes.ok || !listData.success || !Array.isArray(listData.images)) {
      throw new Error('Failed to list images: ' + JSON.stringify(listData));
    }
    const found = listData.images.find((img: any) => img.id === imageId);
    if (!found) {
      throw new Error(`Uploaded image ${imageId} not found in /api/images`);
    }
    if (found.deleteToken !== undefined) {
      throw new Error('Security leak: deleteToken exposed in /api/images list');
    }
    console.log('   ✓ Persistent list returned stored images without deleteToken leaks.');

    // 6. Test unauthorized delete without token
    console.log(`6. Testing DELETE /api/images/${imageId} without token (should fail)...`);
    const unauthorizedRes = await fetch(`${baseUrl}/api/images/${imageId}`, {
      method: 'DELETE',
    });
    if (unauthorizedRes.status !== 403) {
      throw new Error('Expected 403 Unauthorized without token, got: ' + unauthorizedRes.status);
    }
    console.log('   ✓ Unauthorized delete blocked with 403 Forbidden.');

    // 7. Test authorized delete with token
    console.log(`7. Testing DELETE /api/images/${imageId} with valid delete token...`);
    const deleteRes = await fetch(`${baseUrl}/api/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'x-delete-token': deleteToken,
      },
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok || !deleteData.success) {
      throw new Error('Delete failed: ' + JSON.stringify(deleteData));
    }
    console.log('   ✓ Authorized delete succeeded.');

    // 8. Verify image is now 404
    console.log(`8. Verifying /i/${imageId} is now 404 Not Found...`);
    const postDeleteRes = await fetch(`${baseUrl}/i/${imageId}`);
    if (postDeleteRes.status !== 404) {
      throw new Error(`Expected 404 after deletion, got ${postDeleteRes.status}`);
    }
    console.log('   ✓ Old URL correctly returns 404 Unavailable.');

    console.log('\n=============================================');
    console.log('  ALL REAL END-TO-END HTTP TESTS PASSED!');
    console.log('=============================================\n');
    process.exit(0);
  } finally {
    server.close();
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal E2E test failure:', err);
  process.exit(1);
});
