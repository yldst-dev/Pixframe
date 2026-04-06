import { encodeCanvas } from '../export/encode';
import { resolveExportFormat } from '../export/format';
import { ExportMimeType } from '../export/types';

interface ConvertOption {
  type: ExportMimeType;
  quality: number;
}

export default async function convert(canvas: HTMLCanvasElement, options: ConvertOption): Promise<Blob> {
  return await encodeCanvas(canvas, resolveExportFormat(options.type === 'image/jpeg'), options.quality);
}
