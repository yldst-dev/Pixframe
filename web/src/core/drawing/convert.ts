import { encodeCanvas } from '../export/encode';
import { resolveExportFormat } from '../export/format';
import { applyExifMetadata, ExportExifMetadata } from '../export/metadata';
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
  const blob = await encodeCanvas(canvas, format, options.quality);
  return options.sourceFile ? await applyExifMetadata(blob, options.sourceFile, format, options.maintainExif === true, options.fallbackMetadata) : blob;
}
