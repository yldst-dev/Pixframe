import { Icon, ListButton } from 'konsta/react';
import { IoDownloadOutline } from 'react-icons/io5';
import { useStore } from '../store';
import convert from '../../../../core/drawing/convert';
import free from '../../../../core/drawing/free';
import download from '../../../../core/file-system/download';
import * as Root from '../../../../store';
import { useTranslation } from 'react-i18next';
import SIMPLE_FUNC from '../theme/SIMPLE';
import { Capacitor } from '@capacitor/core';
import compress from '../../../../core/file-system/compress';
import Photo from '../../../../core/photo';
import saveNativeBatch from '../../../../core/file-system/save-native-batch';
import { showToast } from '../../../../core/toast';

const DownloadPhotoButton = () => {
  const { t } = useTranslation();
  const { exportToJpeg, quality } = Root.useStore();
  const { backgroundColor, ratio, numberOfRow, numberOfColumn, photos, setLoading, setLoadingProgress, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach } = useStore();

  return (
    <ListButton
      onClick={async () => {
        if (photos.length === 0) return;
        setLoading(true);
        const total = Math.ceil(photos.length / (numberOfRow * numberOfColumn));
        setLoadingProgress({ current: 0, total, currentFileName: '' });
        await new Promise((resolve) => setTimeout(resolve, 100));

        const groups: Photo[][] = [];
        for (let i = 0; i < photos.length; i += numberOfRow * numberOfColumn) {
          groups.push(photos.slice(i, i + numberOfRow * numberOfColumn));
        }

        const resolveFileName = (index: number): string => (exportToJpeg ? `collage-${index}.jpg` : `collage-${index}.webp`);

        try {
          if (Capacitor.isNativePlatform()) {
            const result = await saveNativeBatch(
              {
                total: groups.length,
                getFileName: resolveFileName,
                getFile: async (index: number) => {
                  const group = groups[index];
                  const canvas = SIMPLE_FUNC(group, { backgroundColor, ratio, numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach });
                  try {
                    const filename = resolveFileName(index);
                    const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/webp', quality });
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
                    currentFileName: resolveFileName(index),
                  });
                },
              }
            );

            if (result.failed.length > 0) {
              console.error(`Native collage save failed for ${result.failed.length} files`, result.failed);
              showToast({
                message: t('error.download_failed', 'Download failed. Please try again.'),
                variant: 'error',
              });
            } else {
              showToast(t('root.successfully-downloaded-in-gallery'));
            }
          } else if (groups.length === 1) {
            setLoadingProgress({ current: 1, total: 1, currentFileName: exportToJpeg ? 'collage.jpg' : 'collage.webp' });
            const canvas = SIMPLE_FUNC(groups[0], { backgroundColor, ratio, numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach });
            const filename = exportToJpeg ? 'collage.jpg' : 'collage.webp';
            const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/webp', quality });
            free(canvas);
            await download(filename, data);
          } else {
            const files: { filename: string; data: string }[] = [];
            for (let index = 0; index < groups.length; index += 1) {
              const group = groups[index];
              setLoadingProgress({
                current: index + 1,
                total: groups.length,
                currentFileName: exportToJpeg ? `collage-${index}.jpg` : `collage-${index}.webp`,
              });
              const canvas = SIMPLE_FUNC(group, { backgroundColor, ratio, numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach });
              const filename = exportToJpeg ? `collage-${index}.jpg` : `collage-${index}.webp`;
              const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/webp', quality });
              free(canvas);
              files.push({ filename, data });
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
      <Icon ios={<IoDownloadOutline className="w-5 h-5" />} />
      <div style={{ width: 4 }} />
      {t('root.download')} ({Math.ceil(photos.length / (numberOfRow * numberOfColumn))})
    </ListButton>
  );
};

export default DownloadPhotoButton;
