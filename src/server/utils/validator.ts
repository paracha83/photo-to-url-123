import path from 'path';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
  width?: number;
  height?: number;
}

export function sanitizeFilename(filename: string): string {
  // Normalize backslashes (Windows-style) to slashes to prevent cross-platform traversal
  const normalized = filename.replace(/\\/g, '/');
  // Strip directory paths to prevent path traversal
  const base = path.basename(normalized);
  // Replace characters not alphanumeric, dash, dot, or underscore
  const sanitized = base.replace(/[^a-zA-Z0-9.\-_]/g, '_').trim();
  // Ensure not empty and does not begin with a dot
  const clean = sanitized.replace(/^\.+/, '');
  return clean.length > 0 ? clean.slice(0, 100) : 'image';
}

export function detectMagicBytesAndMime(buffer: Buffer): { mime: string | null; extension: string } {
  if (buffer.length < 12) {
    return { mime: null, extension: '' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', extension: 'png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { mime: 'image/gif', extension: 'gif' };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', extension: 'webp' };
  }

  return { mime: null, extension: '' };
}

export function extractDimensions(buffer: Buffer, mime: string): { width: number; height: number } {
  try {
    if (mime === 'image/png' && buffer.length >= 24) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (mime === 'image/gif' && buffer.length >= 10) {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }

    if (mime === 'image/jpeg') {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        // SOF markers: 0xC0 through 0xCF, except 0xC4 (DHT), 0xC8 (JPG), 0xCC (DAC)
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        // Jump marker segment
        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segmentLength;
      }
    }

    if (mime === 'image/webp' && buffer.length >= 30) {
      // VP8 (lossy)
      if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
      // VP8L (lossless)
      if (buffer.toString('ascii', 12, 16) === 'VP8L') {
        const b1 = buffer[21];
        const b2 = buffer[22];
        const b3 = buffer[23];
        const b4 = buffer[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + ((((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)));
        return { width, height };
      }
      // VP8X (extended)
      if (buffer.toString('ascii', 12, 16) === 'VP8X' && buffer.length >= 30) {
        const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
        const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
        return { width, height };
      }
    }
  } catch (err) {
    console.warn('Failed to extract image dimensions:', err);
  }

  return { width: 0, height: 0 };
}

export function validateImageBuffer(
  buffer: Buffer,
  declaredMime: string,
  maxSizeBytes: number = 10 * 1024 * 1024
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file provided' };
  }

  if (buffer.length > maxSizeBytes) {
    return {
      valid: false,
      error: 'This image is larger than the 10 MB limit.',
    };
  }

  const { mime: detectedMime } = detectMagicBytesAndMime(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      error: "That file type isn't supported.",
    };
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(detectedMime)) {
    return {
      valid: false,
      error: "That file type isn't supported.",
    };
  }

  // Cross-check declared MIME if present and not generic stream
  if (declaredMime && declaredMime !== 'application/octet-stream') {
    const isJpegFamily = (m: string) => m === 'image/jpeg' || m === 'image/jpg';
    if (
      !(isJpegFamily(declaredMime) && isJpegFamily(detectedMime)) &&
      declaredMime.toLowerCase() !== detectedMime
    ) {
      console.warn(`MIME mismatch: declared ${declaredMime}, detected ${detectedMime}`);
    }
  }

  const { width, height } = extractDimensions(buffer, detectedMime);

  return {
    valid: true,
    detectedMime,
    width,
    height,
  };
}
