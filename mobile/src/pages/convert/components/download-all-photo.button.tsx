import { Button } from 'konsta/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store';
import DownloadIcon from '../../../icons/download.icon';
import render from '../../../core/drawing/render';
import themes from '../../../themes';
import { Capacitor } from '@capacitor/core';
import convert from '../../../core/drawing/convert';
import free from '../../../core/drawing/free';
import download from '../../../core/file-system/download';
import compress from '../../../core/file-system/compress';
import saveNativeBatch from '../../../core/file-system/save-native-batch';
import { showToast } from '../../../core/toast';
import Customize from '../../theme/database/customize';
import { ThemeOptionInput, getConverter } from '../../theme/types/theme-option';

const DownloadAllPhotoButton = () => {
  const { t } = useTranslation();
  const store = useStore();
  const { photos, selectedThemeName, exportToJpeg, maintainExif, quality, setLoading, setLoadingProgress } = store;

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
          setLoadingProgress({ current: 0, total: photos.length, currentFileName: photos[0]?.file.name || '' });
          await new Promise((resolve) => setTimeout(resolve, 100));

          const resolveFileName = (index: number): string => photos[index].file.name.replace(/\.[^/.]+$/, `.${exportToJpeg ? 'jpg' : 'png'}`);

          try {
            if (Capacitor.isNativePlatform()) {
              const result = await saveNativeBatch(
                {
                  total: photos.length,
                  getFileName: resolveFileName,
                  getFile: async (index: number) => {
                    const photo = photos[index];
                    const canvas = await render(func!, photo, input, store);
                    try {
                      const filename = resolveFileName(index);
                      const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/png', quality, sourceFile: photo.file, maintainExif, fallbackMetadata: photo.metadata });
                      return { filename, data };
                    } finally {
                      free(canvas);
                    }
                  },
                },
                {
                onProgress: (completed, total) => {
                  const safeCompleted = Math.min(Math.max(completed, 0), total);
                  const index = safeCompleted > 0 ? safeCompleted - 1 : 0;
                  setLoadingProgress({
                    current: safeCompleted,
                    total,
                    currentFileName: photos[index]?.file.name || '',
                  });
                },
                }
              );

              if (result.failed.length > 0) {
                console.error(`Native batch save failed for ${result.failed.length} files`, result.failed);
                showToast({
                  message: t('error.download_failed', 'Download failed. Please try again.'),
                  variant: 'error',
                });
              } else {
                showToast(t('root.successfully-downloaded-in-gallery'));
              }
            } else {
              const files: { filename: string; data: Blob }[] = [];
              for (let i = 0; i < photos.length; i += 1) {
                const photo = photos[i];
                setLoadingProgress({ current: i + 1, total: photos.length, currentFileName: photo.file.name });
                const canvas = await render(func!, photo, input, store);
                try {
                  const filename = photo.file.name.replace(/\.[^/.]+$/, `.${exportToJpeg ? 'jpg' : 'png'}`);
                  const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/png', quality, sourceFile: photo.file, maintainExif, fallbackMetadata: photo.metadata });
                  files.push({ filename, data });
                } finally {
                  free(canvas);
                }
              }
              const zip = await compress(files);
              await download('images.zip', zip);
            }
          } catch (error) {
            console.error('Download failed:', error);
            showToast({
              message: t('error.download_failed', 'Download failed. Please try again.'),
              variant: 'error',
            });
          } finally {
            setLoading(false);
          }
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
