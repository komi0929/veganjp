/**
 * Client-side image compressor
 *
 * Resizes and converts images to WebP before upload.
 * Reduces typical smartphone photos from 3-5MB → 100-200KB.
 *
 * Cost impact: Supabase Free 1GB → ~5,000-10,000 photos instead of ~200-300.
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.75;
const OUTPUT_TYPE = 'image/webp';

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down while maintaining aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }

          // Generate filename with .webp extension
          const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
          const compressed = new File([blob], name, { type: OUTPUT_TYPE });

          resolve(compressed);
        },
        OUTPUT_TYPE,
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
