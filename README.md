# Image To URL — Convert Images to Shareable URLs

Image To URL is a lightning-fast, privacy-first image hosting application built with React, Vite, Tailwind CSS, Express, and modular storage providers. It generates instant shareable URLs, markdown embeds, and HTML snippets with zero image quality degradation.

---

## Architecture Overview

* **Frontend**: React 19 SPA, Tailwind CSS v4, Lucide Icons, Vite.
* **Backend**: Node.js Express server with Vite middleware mode in development, standalone static + API server in production.
* **Serverless Compatibility**: Netlify Functions (`netlify/functions/api.ts`) via `serverless-http`.
* **Primary & Default Storage Provider**: `LocalStorageProvider` (`data/uploads` and `data/metadata.json`), requiring zero cloud credentials or payment card setup.
* **Optional Cloud Storage**: Cloudflare R2 / S3-compatible object storage via AWS SigV4, enabled if `STORAGE_PROVIDER="r2"` or `STORAGE_PROVIDER="s3"` is configured.

---

## 1. Quick Start / Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server (Port 3000)
npm run dev

# 3. Run automated test suite
npm test

# 4. Run type checking
npm run typecheck
```

---

## 2. Production Build & Deployment

```bash
# Build production bundle (TypeScript check + Vite production build)
npm run build

# Start production server
npm run start
```

---

## 3. Storage Configuration

### Primary Storage: Local Storage (Default)
By default, Image To URL uses `LocalStorageProvider`:
* Stores image binaries on disk in `data/uploads/` with memory caching.
* Stores image metadata in `data/metadata.json`.
* Requires **zero** external cloud accounts, credentials, or payment cards.
* All Cloudflare R2 / S3 environment variables are **completely optional and ignored** in local mode.

### Optional Cloud Storage: Cloudflare R2 / S3
If you choose to use Cloudflare R2:
1. Set `STORAGE_PROVIDER="r2"`.
2. Provide the R2 configuration variables:
   - `R2_ACCOUNT_ID`
   - `R2_BUCKET_NAME`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_PUBLIC_URL` (optional custom domain)

---

## 4. Environment Variables Specification

All environment variables below are **SERVER-ONLY** and must never be prefixed with `VITE_` or exposed to client JavaScript.

| Variable Name | Required | Description | Example / Placeholder |
| :--- | :--- | :--- | :--- |
| `STORAGE_PROVIDER` | *Optional* | Active storage engine (`local`, `r2`, `s3`). Defaults to `local`. | `local` |
| `ADMIN_SECRET` | **Yes (Prod)** | Strong administrative secret key for image purges | `strong_random_secret_here` |
| `GEMINI_API_KEY` | *Optional* | Gemini API Key for smart alt-text generation | `AIzaSy...` |
| `MAX_UPLOAD_SIZE` | *Optional* | Maximum upload size in bytes (Default: 10MB) | `10485760` |
| `UPLOAD_RATE_LIMIT`| *Optional* | Uploads allowed per minute per IP (Default: 20) | `20` |
| `APP_URL` | *Optional* | Canonical public origin | `https://imglink.app` |
| `R2_ACCOUNT_ID` | *Optional* | Cloudflare 32-character Account ID (R2 mode only) | `your_cloudflare_account_id` |
| `R2_BUCKET_NAME` | *Optional* | Target R2 bucket name (R2 mode only) | `imglink-uploads` |
| `R2_ACCESS_KEY_ID` | *Optional* | S3-compatible Access Key ID (R2 mode only) | `your_r2_access_key_id` |
| `R2_SECRET_ACCESS_KEY` | *Optional* | S3-compatible Secret Access Key (R2 mode only) | `your_r2_secret_access_key` |
| `R2_PUBLIC_URL` | *Optional* | Custom CDN domain for assets (R2 mode only) | `https://img.yourdomain.com` |

---

## 5. Netlify Deployment

1. Connect your repository to Netlify.
2. Verify settings in `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
3. If using local storage, Netlify Functions handle uploads in-memory/temp storage. If using R2, set the R2 environment variables in Netlify site settings.
4. Trigger deploy. Frontend SPA routes and `/.netlify/functions/api` routes resolve automatically.

---

## 6. Upload & Persistence Lifecycle

1. **Upload (`POST /api/upload`)**:
   - Magic byte header validation against allowed MIME types (`image/png`, `image/jpeg`, `image/webp`, `image/gif`).
   - Dimension and file size extraction.
   - Cryptographic delete token generated (48-char hex) and returned exclusively in upload response runtime memory.
   - Stored via active `StorageProvider`.
2. **Direct Serving (`GET /i/:id`)**:
   - Streams binary image with strict `X-Content-Type-Options: nosniff`, aggressive caching, and ETag support.
3. **List Images (`GET /api/images`)**:
   - Authoritative persistent server listing from the active storage provider.
   - Never exposes `deleteToken`s publicly.
4. **Deletion (`DELETE /api/images/:id`)**:
   - Requires valid `x-delete-token` or valid production `ADMIN_SECRET`.
   - Subsequent requests return HTTP 404.

---

## 7. Automated Verification & Testing

```bash
# Run full unit & security test suite
npm test

# Run real HTTP integration tests
npx tsx scripts/test-e2e.ts

# Run cloud storage integration test (if R2 credentials configured)
npx tsx scripts/test-cloud-storage.ts
```
