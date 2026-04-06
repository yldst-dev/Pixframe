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

const DownloadPhotoButton = () => {
  const { t } = useTranslation();
  const { exportToJpeg, quality } = Root.useStore();
  const { backgroundColor, ratio, numberOfRow, numberOfColumn, photos, setLoading, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach } = useStore();

  return (
    <ListButton
      onClick={async () => {
        if (photos.length === 0) return;
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const groups: Photo[][] = [];
        for (let i = 0; i < photos.length; i += numberOfRow * numberOfColumn) {
          groups.push(photos.slice(i, i + numberOfRow * numberOfColumn));
        }

        if (Capacitor.isNativePlatform()) {
          for (const group of groups) {
            const canvas = SIMPLE_FUNC(group, { backgroundColor, ratio, numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach });
            try {
              const filename = exportToJpeg ? 'collage.jpg' : 'collage.png';
              const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/png', quality });
              await download(filename, data);
            } finally {
              free(canvas);
            }
          }
        } else if (groups.length === 1) {
          const canvas = SIMPLE_FUNC(groups[0], { backgroundColor, ratio, numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach });
          try {
            const filename = exportToJpeg ? 'collage.jpg' : 'collage.png';
            const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/png', quality });
            await download(filename, data);
          } finally {
            free(canvas);
          }
        } else {
          const files: { filename: string; data: Blob }[] = [];
          for (const [index, group] of groups.entries()) {
            const canvas = SIMPLE_FUNC(group, { backgroundColor, ratio, numberOfRow, numberOfColumn, paddingTop, paddingBottom, paddingLeft, paddingRight, marginEach });
            try {
              const filename = exportToJpeg ? `collage-${index}.jpg` : `collage-${index}.png`;
              const data = await convert(canvas, { type: exportToJpeg ? 'image/jpeg' : 'image/png', quality });
              files.push({ filename, data });
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
      <Icon ios={<IoDownloadOutline className="w-5 h-5" />} />
      <div style={{ width: 4 }} />
      {t('root.download')} ({Math.ceil(photos.length / (numberOfRow * numberOfColumn))})
    </ListButton>
  );
};

export default DownloadPhotoButton;
