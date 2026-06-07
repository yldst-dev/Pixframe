import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';
import saveAs from 'file-saver';
import { blobToDataUrl } from '../export/blob';

type DownloadData = Blob | string;

const withDownloadTimestamp = (filename: string, data: DownloadData): DownloadData => {
  if (!(data instanceof Blob)) {
    return data;
  }

  return new File([data], filename, {
    lastModified: Date.now(),
    type: data.type,
  });
};

const resolveNativePath = async (data: DownloadData): Promise<string> => {
  if (typeof data === 'string') {
    return data;
  }

  return await blobToDataUrl(data);
};

export default async function download(filename: string, data: DownloadData): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { albums } = await Media.getAlbums();
    if (!albums.map((album) => album.name).includes('EXIF Frame')) {
      await Media.createAlbum({ name: 'EXIF Frame' });
    }
  }

  switch (Capacitor.getPlatform()) {
    case 'ios': {
      const path = await resolveNativePath(data);
      await Media.savePhoto({
        fileName: filename,
        path,
        albumIdentifier: (await Media.getAlbums()).albums.find((album) => album.name === 'EXIF Frame')?.identifier,
      });
      break;
    }

    case 'android': {
      const path = await resolveNativePath(data);
      await Media.savePhoto({
        fileName: Math.random().toString(36).substring(7) + '_' + filename,
        path,
        albumIdentifier: (await Media.getAlbums()).albums.find((album) => album.name === 'EXIF Frame')?.identifier,
      });
      break;
    }

    case 'web':
      saveAs(withDownloadTimestamp(filename, data), filename);
      break;
  }
}
