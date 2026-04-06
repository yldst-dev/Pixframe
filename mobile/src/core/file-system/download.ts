import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';
import saveAs from 'file-saver';
import { blobToDataUrl } from '../export/blob';

const ALBUM_NAME = 'EXIF Frame';
let albumIdentifierCache: string | null = null;
let androidLastStamp = 0;
let androidStampSequence = 0;
type DownloadData = Blob | string;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveAlbumIdentifier(): Promise<string | undefined> {
  if (Capacitor.getPlatform() !== 'android') {
    return undefined;
  }

  if (albumIdentifierCache !== null) {
    return albumIdentifierCache === '' ? undefined : albumIdentifierCache;
  }

  const { albums } = await Media.getAlbums();
  const existing = albums.find((album) => album.name === ALBUM_NAME);

  if (existing?.identifier) {
    albumIdentifierCache = existing.identifier;
    return existing.identifier;
  }

  try {
    await Media.createAlbum({ name: ALBUM_NAME });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }
  const refreshed = await Media.getAlbums();
  const created = refreshed.albums.find((album) => album.name === ALBUM_NAME);

  if (created?.identifier) {
    albumIdentifierCache = created.identifier;
    return created.identifier;
  }

  const { path } = await Media.getAlbumsPath();
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path;
  const fallback = `${normalized}/${ALBUM_NAME}`;
  albumIdentifierCache = fallback;
  return fallback;
}

function resolveNativeFilename(filename: string): string {
  if (Capacitor.getPlatform() === 'android') {
    const extensionIndex = filename.lastIndexOf('.');
    const baseName = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename;
    const normalizedBaseName = baseName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'image';
    const now = Date.now();
    if (now === androidLastStamp) {
      androidStampSequence += 1;
    } else {
      androidLastStamp = now;
      androidStampSequence = 0;
    }
    const sequence = String(androidStampSequence).padStart(3, '0');
    return `pixframe_${now}${sequence}_${normalizedBaseName}`;
  }

  return filename;
}

async function resolveNativePath(data: DownloadData): Promise<string> {
  if (typeof data === 'string') {
    return data;
  }

  return await blobToDataUrl(data);
}

async function saveNativePhoto(filename: string, data: DownloadData): Promise<void> {
  const platform = Capacitor.getPlatform();
  const albumIdentifier = platform === 'android' ? await resolveAlbumIdentifier() : undefined;
  const path = await resolveNativePath(data);
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (platform === 'android') {
        await Media.savePhoto({
          fileName: resolveNativeFilename(filename),
          path,
          albumIdentifier,
        });
      } else {
        await Media.savePhoto({
          path,
        });
      }
      return;
    } catch (error) {
      lastError = error;
      await sleep(150 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to save photo to native gallery');
}

export default async function download(filename: string, data: DownloadData): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    saveAs(data, filename);
    return;
  }

  await saveNativePhoto(filename, data);
}
