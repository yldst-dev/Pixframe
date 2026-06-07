import Photo from '../photo';
import render from '../drawing/render';
import free from '../drawing/free';
import { Store } from '../../store';
import { ThemeFunc } from '../drawing/theme';
import { ThemeOptionInput } from '../../pages/theme/types/theme-option';
import { buildThemedFileName, resolveExportFormat } from './format';
import { EncodedExportFile, ExportProgress } from './types';
import { exportRenderedCanvas } from './rendered-export';

interface SequentialPhotoExportOptions {
  onProgress?: (progress: ExportProgress) => void;
  photos: Photo[];
  store: Store;
  themeFunc: ThemeFunc;
  themeName: string;
  themeOptions: ThemeOptionInput;
}

export async function* exportPhotosSequentially(options: SequentialPhotoExportOptions): AsyncGenerator<EncodedExportFile> {
  const { onProgress, photos, store, themeFunc, themeName, themeOptions } = options;
  const exportFormat = resolveExportFormat(store.exportToJpeg);
  const normalizedThemeName = themeName.replace(/\s+/g, '_').toLowerCase();

  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];

    onProgress?.({
      current: index + 1,
      currentFileName: photo.file.name,
      total: photos.length,
    });

    const canvas = await render(themeFunc, photo, themeOptions, store);

    try {
      const result = await exportRenderedCanvas(canvas, {
        fallbackMetadata: photo.metadata,
        format: exportFormat,
        maintainExif: store.maintainExif,
        quality: store.quality,
        sourceFile: photo.file,
      });
      yield {
        blob: result.blob,
        filename: buildThemedFileName(photo.file.name, normalizedThemeName, result.format.extension),
        mimeType: result.format.mimeType,
      };
    } finally {
      free(canvas);
    }
  }
}
