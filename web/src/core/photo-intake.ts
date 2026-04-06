import Photo from './photo';

export const MAX_ACTIVE_PHOTOS = 50;

export const splitIncomingFiles = (currentActiveCount: number, files: File[]) => {
  const availableSlots = Math.max(0, MAX_ACTIVE_PHOTOS - Math.max(0, currentActiveCount));
  return {
    acceptedFiles: files.slice(0, availableSlots),
    queuedFiles: files.slice(availableSlots),
  };
};

interface CreatePhotosSequentiallyOptions {
  onProgress?: (current: number, total: number, file: File) => void;
  onError?: (file: File, error: unknown) => void;
}

export const createPhotosSequentially = async (files: File[], options: CreatePhotosSequentiallyOptions = {}) => {
  const photos: Photo[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    options.onProgress?.(index + 1, files.length, file);

    try {
      photos.push(await Photo.create(file));
    } catch (error) {
      console.error(error);
      options.onError?.(file, error);
    }
  }

  return photos;
};
