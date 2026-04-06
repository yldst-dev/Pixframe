export type ExportMimeType = 'image/png' | 'image/jpeg';

export interface ExportFormat {
  extension: 'png' | 'jpg';
  mimeType: ExportMimeType;
  useJpeg: boolean;
}

export interface EncodedExportFile {
  blob: Blob;
  filename: string;
  mimeType: ExportMimeType;
}

export interface ExportProgress {
  current: number;
  currentFileName: string;
  total: number;
}
