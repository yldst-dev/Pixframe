import { encode as encodePng } from '@jsquash/png';
import { resolveJpegQuality } from './format';
import { ExportFormat, ExportMimeType } from './types';

export const canvasToBlob = async (canvas: HTMLCanvasElement, mimeType: ExportMimeType, quality?: number): Promise<Blob> =>
  await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error(`Failed to encode canvas as ${mimeType}`));
    }, mimeType, quality);
  });

const encodeCanvasToPngBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Failed to create 2D context for PNG encoding');
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pngBuffer = await encodePng(imageData);
  return new Blob([pngBuffer], { type: 'image/png' });
};

export const encodeCanvas = async (canvas: HTMLCanvasElement, format: ExportFormat, quality: number): Promise<Blob> => {
  if (format.useJpeg) {
    return await canvasToBlob(canvas, format.mimeType, resolveJpegQuality(quality));
  }

  return await encodeCanvasToPngBlob(canvas);
};
