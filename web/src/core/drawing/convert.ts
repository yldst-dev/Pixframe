import { resolveExportFormat } from '../export/format';
import { ExportExifMetadata } from '../export/metadata';
import { exportRenderedCanvas } from '../export/rendered-export';
import { ExportMimeType } from '../export/types';

interface ConvertOption {
  type: ExportMimeType;
  quality: number;
  fallbackMetadata?: ExportExifMetadata;
  maintainExif?: boolean;
  sourceFile?: File;
}

export default async function convert(canvas: HTMLCanvasElement, options: ConvertOption): Promise<Blob> {
  const format = resolveExportFormat(options.type === 'image/jpeg');
  const result = await exportRenderedCanvas(canvas, {
    fallbackMetadata: options.fallbackMetadata,
    format,
    maintainExif: options.maintainExif,
    quality: options.quality,
    sourceFile: options.sourceFile,
  });
  return result.blob;
}
