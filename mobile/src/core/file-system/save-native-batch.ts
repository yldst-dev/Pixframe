import { Capacitor } from '@capacitor/core';
import download from './download';

export interface NativeSaveFile {
  filename: string;
  data: string;
}

export interface NativeBatchSaveSource {
  total: number;
  getFile: (index: number) => Promise<NativeSaveFile>;
  getFileName?: (index: number) => string;
}

export interface NativeBatchSaveOptions {
  onProgress?: (saved: number, total: number) => void;
}

export interface NativeBatchSaveResult {
  total: number;
  saved: number;
  failed: string[];
}

function resolveFailedFileName(source: NativeSaveFile[] | NativeBatchSaveSource, index: number): string {
  if (Array.isArray(source)) {
    return source[index]?.filename ?? `item-${index + 1}`;
  }

  return source.getFileName?.(index) ?? `item-${index + 1}`;
}

export default async function saveNativeBatch(source: NativeSaveFile[] | NativeBatchSaveSource, options: NativeBatchSaveOptions = {}): Promise<NativeBatchSaveResult> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native batch save requires a native platform');
  }

  const total = Array.isArray(source) ? source.length : source.total;
  let saved = 0;
  const failed: string[] = [];

  for (let index = 0; index < total; index += 1) {
    try {
      const file = Array.isArray(source) ? source[index] : await source.getFile(index);
      await download(file.filename, file.data);
      saved += 1;
    } catch (error) {
      const failedFileName = resolveFailedFileName(source, index);
      failed.push(failedFileName);
      console.error(`Failed to save file: ${failedFileName}`, error);
    }

    options.onProgress?.(index + 1, total);
  }

  return {
    total,
    saved,
    failed,
  };
}
