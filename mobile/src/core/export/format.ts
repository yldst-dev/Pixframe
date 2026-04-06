import { ExportFormat } from './types';

export const resolveExportFormat = (exportToJpeg: boolean): ExportFormat => {
  const useJpeg = exportToJpeg;
  return {
    extension: useJpeg ? 'jpg' : 'png',
    mimeType: useJpeg ? 'image/jpeg' : 'image/png',
    useJpeg,
  };
};

export const resolveJpegQuality = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0.95;
  }

  const normalized = value > 1 ? value / 100 : value;
  return Math.min(1, Math.max(0.1, normalized));
};

export const buildThemedFileName = (originalName: string, themeName: string, extension: string): string => {
  const baseFileName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseFileName}_${themeName}.${extension}`;
};
