export interface ImageRecord {
  id: string;
  originalFilename: string;
  sanitizedFilename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  publicUrl: string;
  deleteToken?: string;
  createdAt: number;
  expiresAt: number | null;
  storageProvider: string;
  objectKey: string;
}

export type StorageDuration = '1h' | '1d' | '7d' | '30d' | 'never';

export interface UploadOptions {
  expiration: StorageDuration;
}

export interface UploadResponse {
  success: boolean;
  image?: ImageRecord;
  error?: string;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface AdminStats {
  totalUploads: number;
  totalBytes: number;
  activeCount: number;
  expiredCount: number;
  provider: string;
  maxUploadSizeBytes: number;
  uploadRateLimit: number;
  recentUploads: Omit<ImageRecord, 'deleteToken'>[];
}

export interface AIAnalysisResult {
  altText: string;
  title: string;
  caption: string;
  tags: string[];
  markdownEmbed: string;
  htmlEmbed: string;
  visualSummary: string;
  suggestedDimensions?: string;
}
