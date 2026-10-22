import crypto from 'crypto';
import { ImageRecord } from '../../types';
import { StorageProvider, UploadFileInput, RetrievedImage } from './StorageProvider';

export interface S3Config {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicDomain?: string;
}

export class S3StorageProvider implements StorageProvider {
  public name: string;
  private config: S3Config;
  private memoryCache: Map<string, ImageRecord> = new Map();

  constructor(config: S3Config) {
    this.config = config;
    // Identify as 'r2' if endpoint is Cloudflare R2 or region/provider indicates R2
    this.name = config.endpoint.includes('r2.cloudflarestorage.com') ? 'r2' : 's3';
  }

  public getPublicUrl(id: string, reqOrigin?: string): string {
    if (this.config.publicDomain) {
      const domain = this.config.publicDomain.replace(/\/$/, '');
      return `${domain}/i/${id}`;
    }
    const base = reqOrigin || process.env.APP_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/i/${id}`;
  }

  /**
   * Generates AWS Signature Version 4 for S3-compatible endpoints (including Cloudflare R2).
   * Supports both query parameters and canonical headers per AWS SigV4 specification.
   */
  private signV4(
    method: string,
    path: string,
    headers: Record<string, string>,
    payloadHash: string,
    query: Record<string, string> = {}
  ): { headers: Record<string, string>; canonicalQueryString: string } {
    const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = datetime.slice(0, 8);
    const service = 's3';
    // Cloudflare R2 accepts 'auto' or 'us-east-1'
    const region = this.config.region || 'auto';

    headers['x-amz-date'] = datetime;
    headers['x-amz-content-sha256'] = payloadHash;

    // Normalizing canonical headers in accordance with AWS SigV4 specification
    const lowerKeyMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      lowerKeyMap[k.toLowerCase()] = v.trim().replace(/\s+/g, ' ');
    }
    const sortedLowerKeys = Object.keys(lowerKeyMap).sort();
    const canonicalHeaders = sortedLowerKeys.map((k) => `${k}:${lowerKeyMap[k]}\n`).join('');
    const signedHeaders = sortedLowerKeys.join(';');

    // Canonical query string sorted alphabetically by encoded parameter key
    const sortedQueryKeys = Object.keys(query).sort();
    const canonicalQueryString = sortedQueryKeys
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
      .join('&');

    const canonicalRequest = [
      method,
      path,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      datetime,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto.createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    headers['Authorization'] = authorization;

    return { headers, canonicalQueryString };
  }

  public async uploadImage(input: UploadFileInput): Promise<ImageRecord> {
    const objectKey = input.id;
    const publicUrl = this.getPublicUrl(input.id, input.reqOrigin);

    const record: ImageRecord = {
      id: input.id,
      originalFilename: input.originalFilename,
      sanitizedFilename: input.originalFilename,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      publicUrl,
      deleteToken: input.deleteToken,
      createdAt: Date.now(),
      expiresAt: input.expiresAt,
      storageProvider: this.name,
      objectKey,
    };

    const host = new URL(this.config.endpoint).host;
    const s3Path = `/${this.config.bucket}/${objectKey}`;
    const payloadHash = crypto.createHash('sha256').update(input.buffer).digest('hex');

    const headers: Record<string, string> = {
      Host: host,
      'Content-Type': input.mimeType,
      'Content-Length': input.size.toString(),
      'x-amz-meta-original-name': encodeURIComponent(input.originalFilename),
      'x-amz-meta-delete-token': input.deleteToken,
      'x-amz-meta-created-at': record.createdAt.toString(),
      'x-amz-meta-expires-at': record.expiresAt ? record.expiresAt.toString() : '',
      'x-amz-meta-width': record.width.toString(),
      'x-amz-meta-height': record.height.toString(),
    };

    this.signV4('PUT', s3Path, headers, payloadHash);

    const res = await fetch(`${this.config.endpoint.replace(/\/$/, '')}${s3Path}`, {
      method: 'PUT',
      headers,
      body: new Uint8Array(input.buffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${this.name.toUpperCase()} upload failed: ${res.status} ${errText}`);
    }

    this.memoryCache.set(input.id, record);
    return record;
  }

  public async getImage(id: string): Promise<RetrievedImage | null> {
    let cachedMeta = this.memoryCache.get(id);

    const host = new URL(this.config.endpoint).host;
    const s3Path = `/${this.config.bucket}/${id}`;
    const payloadHash = crypto.createHash('sha256').update('').digest('hex');

    const headers: Record<string, string> = {
      Host: host,
    };

    this.signV4('GET', s3Path, headers, payloadHash);

    const res = await fetch(`${this.config.endpoint.replace(/\/$/, '')}${s3Path}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      this.memoryCache.delete(id);
      return null;
    }

    // Parse remote S3 / R2 metadata headers
    const mimeType = res.headers.get('content-type') || 'application/octet-stream';
    const rawExpiresAt = res.headers.get('x-amz-meta-expires-at');
    const expiresAt = rawExpiresAt && rawExpiresAt.length > 0 ? parseInt(rawExpiresAt, 10) : null;

    if (expiresAt && Date.now() > expiresAt) {
      await this.deleteImage(id);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!cachedMeta) {
      const rawOrigName = res.headers.get('x-amz-meta-original-name') || '';
      let originalFilename = 'image';
      try {
        originalFilename = decodeURIComponent(rawOrigName);
      } catch {
        originalFilename = rawOrigName || 'image';
      }

      const deleteToken = res.headers.get('x-amz-meta-delete-token') || '';
      const createdAt = parseInt(res.headers.get('x-amz-meta-created-at') || '0', 10) || Date.now();
      const width = parseInt(res.headers.get('x-amz-meta-width') || '0', 10);
      const height = parseInt(res.headers.get('x-amz-meta-height') || '0', 10);

      cachedMeta = {
        id,
        originalFilename,
        sanitizedFilename: originalFilename,
        mimeType,
        size: buffer.length,
        width,
        height,
        publicUrl: this.getPublicUrl(id),
        deleteToken,
        createdAt,
        expiresAt,
        storageProvider: this.name,
        objectKey: id,
      };
      this.memoryCache.set(id, cachedMeta);
    }

    return {
      buffer,
      mimeType,
      metadata: cachedMeta,
    };
  }

  public async deleteImage(id: string): Promise<boolean> {
    this.memoryCache.delete(id);

    try {
      const host = new URL(this.config.endpoint).host;
      const s3Path = `/${this.config.bucket}/${id}`;
      const payloadHash = crypto.createHash('sha256').update('').digest('hex');

      const headers: Record<string, string> = {
        Host: host,
      };

      this.signV4('DELETE', s3Path, headers, payloadHash);

      const res = await fetch(`${this.config.endpoint.replace(/\/$/, '')}${s3Path}`, {
        method: 'DELETE',
        headers,
      });

      return res.ok || res.status === 404;
    } catch (err) {
      console.warn(`Failed to delete ${this.name.toUpperCase()} object:`, err);
      return false;
    }
  }

  public async imageExists(id: string): Promise<boolean> {
    try {
      const host = new URL(this.config.endpoint).host;
      const s3Path = `/${this.config.bucket}/${id}`;
      const payloadHash = crypto.createHash('sha256').update('').digest('hex');

      const headers: Record<string, string> = {
        Host: host,
      };

      this.signV4('HEAD', s3Path, headers, payloadHash);

      const res = await fetch(`${this.config.endpoint.replace(/\/$/, '')}${s3Path}`, {
        method: 'HEAD',
        headers,
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves persistent image records from R2 using ListObjectsV2.
   * R2 itself is the authoritative source of truth.
   */
  public async listImages(): Promise<ImageRecord[]> {
    try {
      const host = new URL(this.config.endpoint).host;
      const s3Path = `/${this.config.bucket}`;
      const payloadHash = crypto.createHash('sha256').update('').digest('hex');

      const headers: Record<string, string> = {
        Host: host,
      };

      const queryParams: Record<string, string> = {
        'list-type': '2',
        'max-keys': '100',
      };

      const { canonicalQueryString } = this.signV4('GET', s3Path, headers, payloadHash, queryParams);
      const endpointBase = this.config.endpoint.replace(/\/$/, '');
      const url = `${endpointBase}${s3Path}?${canonicalQueryString}`;

      const res = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        console.warn(`R2 ListObjectsV2 returned status ${res.status}. Falling back to cached list.`);
        return Array.from(this.memoryCache.values()).sort((a, b) => b.createdAt - a.createdAt);
      }

      const xmlText = await res.text();
      const records: ImageRecord[] = [];

      // Extract all <Contents>...</Contents> XML nodes from ListBucketResult
      const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
      let match;
      while ((match = contentsRegex.exec(xmlText)) !== null) {
        const block = match[1];
        const keyMatch = /<Key>(.*?)<\/Key>/.exec(block);
        const sizeMatch = /<Size>(.*?)<\/Size>/.exec(block);
        const dateMatch = /<LastModified>(.*?)<\/LastModified>/.exec(block);

        if (keyMatch && keyMatch[1]) {
          const key = keyMatch[1];
          const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;
          const lastMod = dateMatch ? Date.parse(dateMatch[1]) : Date.now();

          // Check if richer metadata exists in memoryCache
          const cached = this.memoryCache.get(key);
          if (cached) {
            records.push(cached);
          } else {
            // Reconstruct persistent record from R2 bucket listing
            const ext = key.includes('.') ? key.split('.').pop() || 'jpg' : 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
            const record: ImageRecord = {
              id: key,
              originalFilename: key,
              sanitizedFilename: key,
              mimeType,
              size,
              width: 0,
              height: 0,
              publicUrl: this.getPublicUrl(key),
              createdAt: lastMod,
              expiresAt: null,
              storageProvider: this.name,
              objectKey: key,
            };
            this.memoryCache.set(key, record);
            records.push(record);
          }
        }
      }

      return records.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.warn('Error during R2 listImages query:', err);
      return Array.from(this.memoryCache.values()).sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  public async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    const toDelete: string[] = [];

    for (const [id, meta] of this.memoryCache.entries()) {
      if (meta.expiresAt && now > meta.expiresAt) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      await this.deleteImage(id);
      cleaned++;
    }

    return cleaned;
  }
}

// Aliases for explicit Cloudflare R2 semantics
export const CloudflareR2StorageProvider = S3StorageProvider;
export const R2StorageProvider = S3StorageProvider;
