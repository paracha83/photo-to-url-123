export interface OptimizationParams {
  format: 'image/webp' | 'image/jpeg' | 'image/png';
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
}

export interface OptimizedResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  compressionRatio: number; // e.g. 0.35 = 35% smaller
}

export async function optimizeImageClient(
  file: File | Blob,
  params: OptimizationParams
): Promise<OptimizedResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { naturalWidth: width, naturalHeight: height } = img;

      // Calculate constrained dimensions
      if (params.maxWidth && width > params.maxWidth) {
        height = Math.round((height * params.maxWidth) / width);
        width = params.maxWidth;
      }
      if (params.maxHeight && height > params.maxHeight) {
        width = Math.round((width * params.maxHeight) / height);
        height = params.maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context could not be created'));
        return;
      }

      // If converting to JPEG, fill white background to avoid transparent black artifact
      if (params.format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to encode image from canvas'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const compressionRatio = Math.max(0, Math.round(((originalSize - blob.size) / originalSize) * 100));
            resolve({
              blob,
              dataUrl,
              width,
              height,
              size: blob.size,
              compressionRatio,
            });
          };
          reader.onerror = () => reject(new Error('Failed to read canvas blob'));
          reader.readAsDataURL(blob);
        },
        params.format,
        params.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for optimization'));
    };

    img.src = objectUrl;
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
