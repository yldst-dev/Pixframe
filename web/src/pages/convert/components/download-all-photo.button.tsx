import { Button } from 'konsta/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store';
import DownloadIcon from '../../../icons/download.icon';
import render from '../../../core/drawing/render';
import themes from '../../../themes';
import { Capacitor } from '@capacitor/core';
import free from '../../../core/drawing/free';
import download from '../../../core/file-system/download';
import compress from '../../../core/file-system/compress';
import { resolveExportFormat } from '../../../core/export/format';
import { exportRenderedCanvas } from '../../../core/export/rendered-export';
import Customize from '../../theme/database/customize';
import { ThemeOptionInput, getConverter } from '../../theme/types/theme-option';

const DownloadAllPhotoButton = () => {
  const { t } = useTranslation();
  const store = useStore();
  const { photos, selectedThemeName, exportToJpeg, maintainExif, quality, setLoading } = store;

  const input: ThemeOptionInput = new Map<string, string | number | boolean>();
  const theme = themes.find((theme) => theme.name === selectedThemeName);
  theme?.options.forEach((option) => {
    const value = Customize.get(selectedThemeName, option.id, getConverter(option.type));
    if (value !== null) {
      input.set(option.id, value);
    } else {
      input.set(option.id, option.default);
    }
  });

  const func = theme?.func;

  return (
    <>
      <Button
        clear
        onClick={async () => {
          if (photos.length === 0) return;
          setLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (Capacitor.isNativePlatform()) {
            for (const photo of photos) {
              const canvas = await render(func!, photo, input, store);
              try {
                const result = await exportRenderedCanvas(canvas, {
                  fallbackMetadata: photo.metadata,
                  format: resolveExportFormat(exportToJpeg),
                  maintainExif,
                  quality,
                  sourceFile: photo.file,
                });
                const filename = photo.file.name.replace(/\.[^/.]+$/, `.${result.format.extension}`);
                await download(filename, result.blob);
              } finally {
                free(canvas);
              }
            }
          } else {
            const files: { filename: string; data: Blob }[] = [];
            for (const photo of photos) {
              const canvas = await render(func!, photo, input, store);
              try {
                const result = await exportRenderedCanvas(canvas, {
                  fallbackMetadata: photo.metadata,
                  format: resolveExportFormat(exportToJpeg),
                  maintainExif,
                  quality,
                  sourceFile: photo.file,
                });
                const filename = photo.file.name.replace(/\.[^/.]+$/, `.${result.format.extension}`);
                files.push({ filename, data: result.blob });
              } finally {
                free(canvas);
              }
            }
            const zip = await compress(files);
            await download('images.zip', zip);
          }

          setLoading(false);
        }}
      >
        <DownloadIcon size={16} />
        <div style={{ width: 4 }} />
        {t('root.download-all')}
      </Button>
    </>
  );
};

export default DownloadAllPhotoButton;
