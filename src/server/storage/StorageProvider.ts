import { ImageRecord } from '../../types';

export interface UploadFileInput {
  id: string;
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  expiresAt: number | null;
  deleteToken: string;
  reqOrigin?: string;
}

export interface RetrievedImage {
  buffer: Buffer;
  mimeType: string;
  metadata: ImageRecord;
}

export interface StorageProvider {
  name: string;
  uploadImage(file: UploadFileInput): Promise<ImageRecord>;
  getImage(id: string): Promise<RetrievedImage | null>;
  deleteImage(id: string): Promise<boolean>;
  imageExists(id: string): Promise<boolean>;
  getPublicUrl(id: string, reqOrigin?: string): string;
  listImages(): Promise<ImageRecord[]>;
  cleanupExpired(): Promise<number>;
}
