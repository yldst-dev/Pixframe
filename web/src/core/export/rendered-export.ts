import { encodeCanvas } from './encode';
import { resolveExportFormat, resolveJpegQuality } from './format';
import { applyExifMetadata, ExportExifMetadata } from './metadata';
import { ExportFormat } from './types';
import resize from '../drawing/resize';

export interface RenderedExportResult {
  blob: Blob;
  format: ExportFormat;
}

interface RenderedExportOptions {
  fallbackMetadata?: ExportExifMetadata;
  format: ExportFormat;
  maintainExif?: boolean;
  quality: number;
  sourceFile?: File;
}

const MAX_SOURCE_SIZE_MULTIPLIER = 2;
const JPEG_SIZE_GUARD_QUALITIES = [0.92, 0.86, 0.8, 0.72, 0.64, 0.56, 0.48, 0.4, 0.32, 0.24, 0.16, 0.1];

const uniqueQualities = (values: number[]): number[] => {
  const seen = new Set<number>();
  return values
    .map((value) => Math.round(resolveJpegQuality(value) * 100) / 100)
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
};

const withMetadata = async (blob: Blob, sourceFile: File | undefined, format: ExportFormat, maintainExif: boolean | undefined, fallbackMetadata: ExportExifMetadata | undefined): Promise<Blob> =>
  sourceFile ? await applyExifMetadata(blob, sourceFile, format, maintainExif === true, fallbackMetadata) : blob;

const encodeCandidate = async (canvas: HTMLCanvasElement, format: ExportFormat, quality: number, options: RenderedExportOptions): Promise<RenderedExportResult> => {
  const encodedBlob = await encodeCanvas(canvas, format, quality);
  const blob = await withMetadata(encodedBlob, options.sourceFile, format, options.maintainExif, options.fallbackMetadata);
  return { blob, format };
};

const isWithinSourceLimit = (result: RenderedExportResult, sourceFile: File | undefined): boolean => !sourceFile || sourceFile.size <= 0 || result.blob.size <= sourceFile.size * MAX_SOURCE_SIZE_MULTIPLIER;

const loadSourceDimensions = async (sourceFile: File | undefined): Promise<{ height: number; width: number } | null> => {
  if (!sourceFile) {
    return null;
  }

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(sourceFile);
      const dimensions = { height: bitmap.height, width: bitmap.width };
      bitmap.close();
      return dimensions;
    } catch {
      return null;
    }
  }

  return null;
};

const resizeCanvasForSourceLimit = async (canvas: HTMLCanvasElement, sourceFile: File | undefined, currentSize: number): Promise<HTMLCanvasElement | null> => {
  const dimensions = await loadSourceDimensions(sourceFile);
  if (!dimensions || !sourceFile || sourceFile.size <= 0) {
    return null;
  }

  const canvasLongEdge = Math.max(canvas.width, canvas.height);
  const sourceLongEdge = Math.max(dimensions.width, dimensions.height);
  if (canvasLongEdge <= sourceLongEdge && currentSize <= sourceFile.size * MAX_SOURCE_SIZE_MULTIPLIER) {
    return null;
  }

  const sizeScale = Math.sqrt((sourceFile.size * MAX_SOURCE_SIZE_MULTIPLIER) / Math.max(currentSize, 1)) * 0.95;
  const edgeScale = sourceLongEdge / canvasLongEdge;
  const scale = Math.max(0.05, Math.min(1, edgeScale, Number.isFinite(sizeScale) ? sizeScale : 1));
  if (scale >= 1) {
    return null;
  }

  return resize(canvas, Math.max(1, Math.round(canvas.width * scale)), Math.max(1, Math.round(canvas.height * scale)));
};

export const exportRenderedCanvas = async (canvas: HTMLCanvasElement, options: RenderedExportOptions): Promise<RenderedExportResult> => {
  const requested = await encodeCandidate(canvas, options.format, options.quality, options);
  if (isWithinSourceLimit(requested, options.sourceFile)) {
    return requested;
  }

  const jpegFormat = resolveExportFormat(true);
  const qualityCandidates = options.format.useJpeg
    ? uniqueQualities([options.quality, ...JPEG_SIZE_GUARD_QUALITIES]).filter((quality) => quality < resolveJpegQuality(options.quality))
    : uniqueQualities([options.quality, ...JPEG_SIZE_GUARD_QUALITIES]);

  let smallest = requested;
  for (const quality of qualityCandidates) {
    const candidate = await encodeCandidate(canvas, jpegFormat, quality, options);
    if (candidate.blob.size < smallest.blob.size) {
      smallest = candidate;
    }
    if (isWithinSourceLimit(candidate, options.sourceFile)) {
      return candidate;
    }
  }

  const resizedCanvas = await resizeCanvasForSourceLimit(canvas, options.sourceFile, smallest.blob.size);
  if (resizedCanvas) {
    try {
      for (const quality of uniqueQualities([...qualityCandidates, 0.1])) {
        const candidate = await encodeCandidate(resizedCanvas, jpegFormat, quality, options);
        if (candidate.blob.size < smallest.blob.size) {
          smallest = candidate;
        }
        if (isWithinSourceLimit(candidate, options.sourceFile)) {
          return candidate;
        }
      }
    } finally {
      resizedCanvas.width = 0;
      resizedCanvas.height = 0;
    }
  }

  return smallest;
};
