import fs from 'fs';
import path from 'path';
import { ImageRecord } from '../../types';
import { StorageProvider, UploadFileInput, RetrievedImage } from './StorageProvider';

export class LocalStorageProvider implements StorageProvider {
  public name = 'local';
  private uploadsDir: string;
  private metadataPath: string;
  private memoryCache: Map<string, { buffer: Buffer; metadata: ImageRecord }> = new Map();

  constructor() {
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
    this.uploadsDir = path.join(dataDir, 'uploads');
    this.metadataPath = path.join(dataDir, 'metadata.json');

    try {
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }
      if (!fs.existsSync(this.metadataPath)) {
        fs.writeFileSync(this.metadataPath, JSON.stringify({}), 'utf-8');
      }
      this.loadExistingMetadata();
    } catch (err) {
      console.warn('Storage directory initialization warning (falling back to memory):', err);
    }
  }

  private loadExistingMetadata() {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const raw = fs.readFileSync(this.metadataPath, 'utf-8');
        const parsed = JSON.parse(raw) as Record<string, ImageRecord>;
        for (const [id, record] of Object.entries(parsed)) {
          const filePath = path.join(this.uploadsDir, record.objectKey);
          if (fs.existsSync(filePath)) {
            const buf = fs.readFileSync(filePath);
            this.memoryCache.set(id, { buffer: buf, metadata: record });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load existing metadata:', err);
    }
  }

  private persistMetadata() {
    try {
      const records: Record<string, ImageRecord> = {};
      for (const [id, item] of this.memoryCache.entries()) {
        records[id] = item.metadata;
      }
      fs.writeFileSync(this.metadataPath, JSON.stringify(records, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write metadata to disk:', err);
    }
  }

  public getPublicUrl(id: string, reqOrigin?: string): string {
    const base = reqOrigin || process.env.APP_URL || '';
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/i/${id}`;
  }

  public async uploadImage(input: UploadFileInput): Promise<ImageRecord> {
    const ext = input.mimeType.split('/')[1] || 'jpg';
    const objectKey = `${input.id}.${ext}`;
    const publicUrl = this.getPublicUrl(input.id, input.reqOrigin);

    const record: ImageRecord = {
      id: input.id,
      originalFilename: input.originalFilename,
      sanitizedFilename: `${input.id}.${ext}`,
      mimeType: input.mimeType,
      size: input.size,
      width: input.width,
      height: input.height,
      publicUrl,
      deleteToken: input.deleteToken,
      createdAt: Date.now(),
      expiresAt: input.expiresAt,
      storageProvider: 'local',
      objectKey,
    };

    // Store to memory cache
    this.memoryCache.set(input.id, {
      buffer: input.buffer,
      metadata: record,
    });

    // Persist to disk if possible
    try {
      const filePath = path.join(this.uploadsDir, objectKey);
      fs.writeFileSync(filePath, input.buffer);
      this.persistMetadata();
    } catch (err) {
      console.warn('Warning: Could not persist image file to disk, cached in memory:', err);
    }

    return record;
  }

  public async getImage(id: string): Promise<RetrievedImage | null> {
    // Check cache
    const item = this.memoryCache.get(id);
    if (!item) {
      return null;
    }

    // Check expiration (read-time expiration)
    if (item.metadata.expiresAt && Date.now() > item.metadata.expiresAt) {
      await this.deleteImage(id);
      return null;
    }

    return {
      buffer: item.buffer,
      mimeType: item.metadata.mimeType,
      metadata: item.metadata,
    };
  }

  public async deleteImage(id: string): Promise<boolean> {
    const item = this.memoryCache.get(id);
    if (!item) {
      return false;
    }

    this.memoryCache.delete(id);

    try {
      const filePath = path.join(this.uploadsDir, item.metadata.objectKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.persistMetadata();
    } catch (err) {
      console.warn('Error deleting image file from disk:', err);
    }

    return true;
  }

  public async imageExists(id: string): Promise<boolean> {
    const item = this.memoryCache.get(id);
    if (!item) return false;
    if (item.metadata.expiresAt && Date.now() > item.metadata.expiresAt) {
      await this.deleteImage(id);
      return false;
    }
    return true;
  }

  public async listImages(): Promise<ImageRecord[]> {
    const list: ImageRecord[] = [];
    const now = Date.now();
    for (const [id, item] of this.memoryCache.entries()) {
      if (item.metadata.expiresAt && now > item.metadata.expiresAt) {
        // Expired, skip
        continue;
      }
      list.push(item.metadata);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  public async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    const toDelete: string[] = [];

    for (const [id, item] of this.memoryCache.entries()) {
      if (item.metadata.expiresAt && now > item.metadata.expiresAt) {
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
