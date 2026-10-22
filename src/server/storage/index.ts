import { StorageProvider, UploadFileInput, RetrievedImage } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import type { S3Config } from './S3StorageProvider';

let instance: StorageProvider | null = null;

export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.CONTEXT === 'production' ||
    process.env.NETLIFY === 'true'
  );
}

/**
 * Resolves the active storage provider name based on process.env.STORAGE_PROVIDER.
 * Strictly prioritizes 'local' by default. Cloud-based providers ('r2', 's3')
 * are ONLY chosen when explicitly set in the STORAGE_PROVIDER environment variable.
 */
export function getActiveStorageProviderName(): 'local' | 'r2' | 's3' {
  const envProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase().trim();
  if (envProvider === 'r2') return 'r2';
  if (envProvider === 's3') return 's3';
  return 'local';
}

/**
 * Unified storage configuration reader.
 * Reads STORAGE_PROVIDER from environment variables, defaulting to 'local'.
 */
export function getStorageConfig() {
  const isProd = isProductionEnvironment();
  const provider = getActiveStorageProviderName();
  const isCloudRequested = provider === 'r2' || provider === 's3';

  // Support both Cloudflare R2 and standard S3 variable conventions
  const bucket =
    process.env.R2_BUCKET_NAME ||
    process.env.STORAGE_BUCKET ||
    process.env.R2_BUCKET ||
    process.env.S3_BUCKET;

  const accessKey =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.STORAGE_ACCESS_KEY ||
    process.env.S3_ACCESS_KEY_ID;

  const secretKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.STORAGE_SECRET_KEY ||
    process.env.S3_SECRET_ACCESS_KEY;

  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.STORAGE_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    process.env.S3_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  const region =
    process.env.STORAGE_REGION ||
    process.env.R2_REGION ||
    process.env.S3_REGION ||
    'auto';

  const publicDomain =
    process.env.R2_PUBLIC_URL ||
    process.env.STORAGE_PUBLIC_DOMAIN ||
    process.env.S3_PUBLIC_DOMAIN;

  const hasExternalCredentials = Boolean(bucket && accessKey && secretKey && endpoint);
  const isR2 = Boolean(
    (endpoint && endpoint.includes('r2.cloudflarestorage.com')) ||
    accountId ||
    provider === 'r2'
  );

  return {
    provider,
    isR2,
    bucket,
    accessKey,
    secretKey,
    endpoint,
    region,
    publicDomain,
    hasExternalCredentials,
    isProduction: isProd,
    isCloudRequested,
  };
}

export function validateStorageEnvironment(): {
  valid: boolean;
  missingVars: string[];
  provider: string;
  isProduction: boolean;
} {
  const isProd = isProductionEnvironment();
  const config = getStorageConfig();

  // In local mode (default), all R2 / S3 environment variables are optional and ignored
  if (config.provider === 'local') {
    return {
      valid: true,
      missingVars: [],
      provider: 'local',
      isProduction: isProd,
    };
  }

  // When explicitly configured for cloud storage (R2/S3), check required variables
  const missing: string[] = [];
  if (!config.bucket) missing.push('R2_BUCKET_NAME (or STORAGE_BUCKET)');
  if (!config.accessKey) missing.push('R2_ACCESS_KEY_ID (or STORAGE_ACCESS_KEY)');
  if (!config.secretKey) missing.push('R2_SECRET_ACCESS_KEY (or STORAGE_SECRET_KEY)');
  if (!config.endpoint && !process.env.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID (or STORAGE_ENDPOINT)');

  return {
    valid: missing.length === 0,
    missingVars: missing,
    provider: config.provider,
    isProduction: isProd,
  };
}

export function isStorageConfigured(): boolean {
  const config = getStorageConfig();

  // LocalStorageProvider is primary and always configured and ready to use
  if (config.provider === 'local') {
    return true;
  }

  // Cloud storage (R2/S3) requires external credentials
  return config.hasExternalCredentials;
}

/**
 * Lazy delegate for S3/Cloudflare R2 storage provider.
 * Ensures any R2-related code (AWS SigV4 signing, XML parsing, etc.)
 * is only loaded if explicitly selected via STORAGE_PROVIDER="r2" or "s3".
 */
export class LazyS3StorageProvider implements StorageProvider {
  public name: string;
  private config: ReturnType<typeof getStorageConfig>;
  private delegateInstance: StorageProvider | null = null;
  private delegatePromise: Promise<StorageProvider> | null = null;

  constructor(config: ReturnType<typeof getStorageConfig>) {
    this.config = config;
    this.name = config.isR2 ? 'r2' : 's3';
  }

  private async getDelegate(): Promise<StorageProvider> {
    if (this.delegateInstance) {
      return this.delegateInstance;
    }
    if (!this.delegatePromise) {
      this.delegatePromise = (async () => {
        // Dynamically import S3StorageProvider ONLY when explicitly selected
        const { S3StorageProvider } = await import('./S3StorageProvider');
        this.delegateInstance = new S3StorageProvider({
          bucket: this.config.bucket!,
          region: this.config.region,
          endpoint: this.config.endpoint!,
          accessKeyId: this.config.accessKey!,
          secretAccessKey: this.config.secretKey!,
          publicDomain: this.config.publicDomain,
        });
        return this.delegateInstance;
      })();
    }
    return this.delegatePromise;
  }

  public getPublicUrl(id: string, reqOrigin?: string): string {
    if (this.delegateInstance) {
      return this.delegateInstance.getPublicUrl(id, reqOrigin);
    }
    if (this.config.publicDomain) {
      const domain = this.config.publicDomain.replace(/\/$/, '');
      return `${domain}/i/${id}`;
    }
    const base = reqOrigin || process.env.APP_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/i/${id}`;
  }

  public async uploadImage(file: UploadFileInput) {
    const delegate = await this.getDelegate();
    return delegate.uploadImage(file);
  }

  public async getImage(id: string): Promise<RetrievedImage | null> {
    const delegate = await this.getDelegate();
    return delegate.getImage(id);
  }

  public async deleteImage(id: string): Promise<boolean> {
    const delegate = await this.getDelegate();
    return delegate.deleteImage(id);
  }

  public async imageExists(id: string): Promise<boolean> {
    const delegate = await this.getDelegate();
    return delegate.imageExists(id);
  }

  public async listImages() {
    const delegate = await this.getDelegate();
    return delegate.listImages();
  }

  public async cleanupExpired(): Promise<number> {
    const delegate = await this.getDelegate();
    return delegate.cleanupExpired();
  }
}

/**
 * Unified StorageProvider initialization logic.
 * Prioritizes LocalStorageProvider by default and reads the STORAGE_PROVIDER environment variable,
 * ensuring that cloud-based providers (like R2/S3) are only conditionally initialized when explicitly requested.
 */
export function getStorageProvider(): StorageProvider {
  if (instance) {
    return instance;
  }

  const providerName = getActiveStorageProviderName();

  // 1. PRIORITIZE LocalStorageProvider by default
  // Instantiates LocalStorageProvider directly with zero R2 code loaded.
  if (providerName === 'local') {
    console.log('Using LocalStorageProvider as primary storage provider (default).');
    instance = new LocalStorageProvider();
    return instance;
  }

  // 2. Conditionally initialize cloud-based providers (R2/S3) ONLY when explicitly requested
  const config = getStorageConfig();
  if (config.hasExternalCredentials) {
    console.log(
      `Initializing ${config.isR2 ? 'Cloudflare R2' : 'S3'} StorageProvider (explicitly requested via STORAGE_PROVIDER) with bucket: ${config.bucket}`
    );
    instance = new LazyS3StorageProvider(config);
    return instance;
  }

  throw new Error(
    `Storage provider '${providerName}' was explicitly requested via STORAGE_PROVIDER, but required credentials are missing.`
  );
}

export function _resetStorageProviderInstance(): void {
  instance = null;
}

export * from './StorageProvider';
export * from './LocalStorageProvider';
export type { S3Config } from './S3StorageProvider';
