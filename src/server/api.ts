import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { getStorageProvider, isStorageConfigured } from './storage';
import { validateImageBuffer, sanitizeFilename } from './utils/validator';
import { uploadRateLimiter, deleteRateLimiter, generalRateLimiter } from './utils/rateLimiter';
import { StorageDuration } from '../types';

export const apiRouter = Router();

// Configure multer for in-memory upload buffering
const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE) || 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSize,
  },
});

// Helper to calculate expiration epoch
function parseExpiration(expiration?: string): number | null {
  const now = Date.now();
  switch (expiration as StorageDuration) {
    case '1h':
      return now + 60 * 60 * 1000;
    case '1d':
      return now + 24 * 60 * 60 * 1000;
    case '7d':
      return now + 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now + 30 * 24 * 60 * 60 * 1000;
    case 'never':
    default:
      return null;
  }
}

function generateSecureId(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
apiRouter.get('/health', generalRateLimiter.middleware(), (req: Request, res: Response) => {
  const configured = isStorageConfigured();
  let providerName = 'unconfigured';
  try {
    const storage = getStorageProvider();
    providerName = storage.name;
  } catch {
    providerName = 'unconfigured';
  }

  res.json({
    status: configured ? 'ok' : 'unconfigured',
    storageConfigured: configured,
    storageProvider: providerName,
    maxUploadSizeBytes: maxUploadSize,
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Upload Image
// -------------------------------------------------------------
apiRouter.post(
  '/upload',
  uploadRateLimiter.middleware(),
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      let fileBuffer: Buffer | null = null;
      let originalFilename = 'image.jpg';
      let mimeType = 'image/jpeg';

      if (req.file) {
        fileBuffer = req.file.buffer;
        originalFilename = req.file.originalname || 'image.jpg';
        mimeType = req.file.mimetype;
      } else if (req.body?.base64) {
        // Base64 upload support
        const matches = req.body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], 'base64');
        } else {
          fileBuffer = Buffer.from(req.body.base64, 'base64');
        }
        if (req.body.filename) {
          originalFilename = req.body.filename;
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        res.status(400).json({
          success: false,
          error: 'NO_FILE_PROVIDED',
          message: 'Please select an image file to upload.',
        });
        return;
      }

      // Validate file size and magic bytes
      const validation = validateImageBuffer(fileBuffer, mimeType, maxUploadSize);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'INVALID_FILE',
          message: validation.error || 'Invalid image file provided.',
        });
        return;
      }

      if (!isStorageConfigured()) {
        res.status(503).json({
          success: false,
          error: 'STORAGE_NOT_CONFIGURED',
          message: 'Storage is not configured.',
        });
        return;
      }

      const storage = getStorageProvider();
      const id = generateSecureId(10);
      const deleteToken = crypto.randomBytes(24).toString('hex');
      const safeName = sanitizeFilename(originalFilename);
      const expiresAt = parseExpiration(req.body.expiration);

      // Determine public URL base from incoming request
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const reqOrigin = `${protocol}://${host}`;

      const record = await storage.uploadImage({
        id,
        buffer: fileBuffer,
        originalFilename: safeName,
        mimeType: validation.detectedMime || mimeType,
        size: fileBuffer.length,
        width: validation.width || 0,
        height: validation.height || 0,
        expiresAt,
        deleteToken,
        reqOrigin,
      });

      // Update publicUrl with real host
      record.publicUrl = storage.getPublicUrl(id, reqOrigin);

      // Sanitize record to ensure deleteToken is not nested in public metadata
      const safeRecord = { ...record };
      delete (safeRecord as Partial<typeof safeRecord>).deleteToken;

      res.status(201).json({
        success: true,
        id: record.id,
        url: record.publicUrl,
        mimeType: record.mimeType,
        size: record.size,
        image: safeRecord,
        deleteToken: record.deleteToken, // Delivered exclusively to the uploader's runtime response
      });
    } catch (err: unknown) {
      console.error('Upload handler error:', err);
      res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: "We couldn't upload your image right now. Please try again.",
      });
    }
  }
);

// -------------------------------------------------------------
// List Images (Persistent Storage)
// -------------------------------------------------------------
apiRouter.get(
  '/images',
  generalRateLimiter.middleware(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!isStorageConfigured()) {
        res.status(503).json({
          success: false,
          error: 'STORAGE_NOT_CONFIGURED',
          message: 'Storage is not configured.',
          images: [],
        });
        return;
      }

      const storage = getStorageProvider();
      const images = await storage.listImages();

      // Security requirement: deleteToken is NEVER returned in public list
      const sanitized = images.map((img) => {
        const copy = { ...img };
        delete (copy as Partial<typeof copy>).deleteToken;
        return copy;
      });

      res.json({
        success: true,
        count: sanitized.length,
        images: sanitized,
      });
    } catch (err) {
      console.error('List images error:', err);
      res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to retrieve stored images.',
        images: [],
      });
    }
  }
);

// -------------------------------------------------------------
// Get Image Details
// -------------------------------------------------------------
apiRouter.get(
  '/images/:id',
  generalRateLimiter.middleware(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const storage = getStorageProvider();
      const item = await storage.getImage(id);

      if (!item) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Image not found or has expired.',
        });
        return;
      }

      // Security requirement: deleteToken is NEVER returned by GET /api/images/:id
      const safeRecord = { ...item.metadata };
      delete (safeRecord as Partial<typeof safeRecord>).deleteToken;

      res.json({
        success: true,
        image: safeRecord,
      });
    } catch (err) {
      console.error('Get image metadata error:', err);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to retrieve image details.',
      });
    }
  }
);

// -------------------------------------------------------------
// Delete Image
// -------------------------------------------------------------
apiRouter.delete(
  '/images/:id',
  deleteRateLimiter.middleware(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const providedToken = (req.headers['x-delete-token'] as string) || (req.query.token as string);
      const adminSecret = req.headers['x-admin-secret'] as string;
      const isProd = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';
      // In production, ADMIN_SECRET must be explicitly set and never defaults to 'admin123'
      const configuredAdminSecret = process.env.ADMIN_SECRET || (isProd ? undefined : 'admin123');

      const storage = getStorageProvider();
      const existing = await storage.getImage(id);

      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Image does not exist or has already been deleted.',
        });
        return;
      }

      // Verify authorization
      const isOwner = Boolean(providedToken && providedToken === existing.metadata.deleteToken);
      const isAdmin = Boolean(configuredAdminSecret && adminSecret && adminSecret === configuredAdminSecret);

      if (!isOwner && !isAdmin) {
        res.status(403).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Invalid delete token. You do not have permission to delete this image.',
        });
        return;
      }

      const deleted = await storage.deleteImage(id);
      if (!deleted) {
        res.status(500).json({
          success: false,
          error: 'DELETE_FAILED',
          message: 'Could not delete the image from storage.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Image successfully deleted from persistent storage.',
      });
    } catch (err) {
      console.error('Delete image error:', err);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An error occurred while deleting the image.',
      });
    }
  }
);

// -------------------------------------------------------------
// AI Smart Accessibility & Alt-Text Generator
// Uses gemini-3.1-pro-preview with ThinkingLevel.HIGH per instructions!
// -------------------------------------------------------------
apiRouter.post(
  '/ai/analyze',
  generalRateLimiter.middleware(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, prompt } = req.body;
      if (!id) {
        res.status(400).json({ success: false, error: 'MISSING_ID', message: 'Image ID is required.' });
        return;
      }

      const storage = getStorageProvider();
      const item = await storage.getImage(id);
      if (!item) {
        res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Image not found.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({
          success: false,
          error: 'AI_NOT_CONFIGURED',
          message: 'Gemini API key is not configured on the server.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const base64Data = item.buffer.toString('base64');
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: item.mimeType,
              },
            },
            {
              text:
                prompt ||
                'Analyze this uploaded image deeply. Provide: 1. A concise, highly accessible WCAG 2.1 alt-text description (1-2 sentences). 2. A descriptive title for sharing. 3. A 2-sentence caption. 4. 5-8 relevant searchable tags/keywords. 5. Visual summary noting key composition elements, colors, and layout. Respond in clean JSON with fields: altText, title, caption, tags (array), visualSummary.',
            },
          ],
        },
        config: {
          systemInstruction:
            'You are an expert accessibility engineer and computer vision specialist. Output your analysis strictly as JSON.',
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      const responseText = response.text || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { altText: responseText, visualSummary: responseText, tags: [] };
      }

      res.json({
        success: true,
        analysis: parsed,
      });
    } catch (err: unknown) {
      console.error('AI Analysis error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        success: false,
        error: 'AI_ERROR',
        message: 'Could not generate AI visual analysis: ' + errMsg,
      });
    }
  }
);

function getValidAdminSecret(): string | undefined {
  const isProd = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';
  return process.env.ADMIN_SECRET || (isProd ? undefined : 'admin123');
}

// -------------------------------------------------------------
// Admin Endpoints
// -------------------------------------------------------------
apiRouter.post('/admin/login', (req: Request, res: Response): void => {
  const { secret } = req.body;
  const configuredSecret = getValidAdminSecret();
  if (!configuredSecret || !secret || secret !== configuredSecret) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Invalid admin secret.' });
    return;
  }
  res.json({ success: true, message: 'Admin authenticated successfully.' });
});

apiRouter.get('/admin/stats', async (req: Request, res: Response): Promise<void> => {
  const adminSecret = req.headers['x-admin-secret'] as string;
  const configuredSecret = getValidAdminSecret();

  if (!configuredSecret || !adminSecret || adminSecret !== configuredSecret) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Admin authorization required.' });
    return;
  }

  try {
    const storage = getStorageProvider();
    const images = await storage.listImages();
    const totalBytes = images.reduce((acc, img) => acc + img.size, 0);

    // Clean deleteTokens from stats response
    const sanitizedImages = images.map((img) => {
      const copy = { ...img };
      delete (copy as Partial<typeof copy>).deleteToken;
      return copy;
    });

    res.json({
      success: true,
      stats: {
        totalUploads: images.length,
        totalBytes,
        activeCount: images.length,
        expiredCount: 0,
        provider: storage.name,
        maxUploadSizeBytes: maxUploadSize,
        uploadRateLimit: Number(process.env.UPLOAD_RATE_LIMIT) || 30,
        recentUploads: sanitizedImages.slice(0, 50),
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to retrieve admin stats.' });
  }
});

apiRouter.delete('/admin/images/:id', async (req: Request, res: Response): Promise<void> => {
  const adminSecret = req.headers['x-admin-secret'] as string;
  const configuredSecret = getValidAdminSecret();

  if (!configuredSecret || !adminSecret || adminSecret !== configuredSecret) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Admin authorization required.' });
    return;
  }

  try {
    const storage = getStorageProvider();
    const deleted = await storage.deleteImage(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Image not found.' });
      return;
    }
    res.json({ success: true, message: `Image ${req.params.id} permanently deleted by administrator.` });
  } catch (err) {
    console.error('Admin delete error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Admin delete operation failed.' });
  }
});

apiRouter.post('/admin/cleanup', async (req: Request, res: Response): Promise<void> => {
  const adminSecret = req.headers['x-admin-secret'] as string;
  const configuredSecret = getValidAdminSecret();

  if (!configuredSecret || !adminSecret || adminSecret !== configuredSecret) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Admin authorization required.' });
    return;
  }

  try {
    const storage = getStorageProvider();
    const count = await storage.cleanupExpired();
    res.json({ success: true, cleanedCount: count, message: `Purged ${count} expired images.` });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Cleanup operation failed.' });
  }
});
