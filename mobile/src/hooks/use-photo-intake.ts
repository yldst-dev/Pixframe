import { useCallback, useEffect, useRef } from 'react';
import { MAX_ACTIVE_PHOTOS, createPhotosSequentially, splitIncomingFiles } from '../core/photo-intake';
import { usePhotoStore } from '../stores/photo-store';
import { useUIStore } from '../stores/ui-store';

interface UsePhotoIntakeOptions {
  onManualPhotosAdded?: (startIndex: number, addedCount: number) => void;
}

export const usePhotoIntake = ({ onManualPhotosAdded }: UsePhotoIntakeOptions = {}) => {
  const loading = useUIStore((state) => state.loading);
  const photosLength = usePhotoStore((state) => state.photos.length);
  const queuedFilesLength = usePhotoStore((state) => state.queuedFiles.length);
  const drainingRef = useRef(false);

  const processFiles = useCallback(
    async (files: File[], source: 'manual' | 'queue') => {
      if (!files.length) return 0;

      const photoStore = usePhotoStore.getState();
      const uiStore = useUIStore.getState();
      const startIndex = photoStore.photos.length;

      uiStore.setLoading(true);
      uiStore.setLoadingProgress({
        current: 0,
        total: files.length,
        currentFileName: files[0]?.name || '',
      });

      try {
        const newPhotos = await createPhotosSequentially(files, {
          onProgress: (current, total, file) => {
            uiStore.setLoadingProgress({
              current,
              total,
              currentFileName: file.name,
            });
          },
        });

        if (!newPhotos.length) {
          if (source === 'manual') {
            uiStore.setOpenedAddPhotoErrorDialog(true);
          }
          return 0;
        }

        usePhotoStore.getState().addPhotos(newPhotos);

        if (source === 'manual') {
          onManualPhotosAdded?.(startIndex, newPhotos.length);
        }

        return newPhotos.length;
      } finally {
        uiStore.setLoading(false);
      }
    },
    [onManualPhotosAdded],
  );

  const addFiles = useCallback(
    async (inputFiles: File[] | FileList) => {
      const files = Array.from(inputFiles);
      if (!files.length) return;

      const photoStore = usePhotoStore.getState();
      const { acceptedFiles, queuedFiles } = splitIncomingFiles(photoStore.photos.length, files);

      if (queuedFiles.length > 0) {
        photoStore.enqueueFiles(queuedFiles);
        useUIStore.getState().setPhotoQueueNotice({
          acceptedCount: acceptedFiles.length,
          queuedCount: queuedFiles.length,
          queueTotal: photoStore.queuedFiles.length + queuedFiles.length,
          activeLimit: MAX_ACTIVE_PHOTOS,
        });
      }

      if (!acceptedFiles.length) return;

      await processFiles(acceptedFiles, 'manual');
    },
    [processFiles],
  );

  useEffect(() => {
    if (loading || drainingRef.current) return;

    const photoStore = usePhotoStore.getState();
    const availableSlots = MAX_ACTIVE_PHOTOS - photoStore.photos.length;

    if (availableSlots <= 0 || photoStore.queuedFiles.length === 0) return;

    const queuedFiles = photoStore.takeQueuedFiles(availableSlots);
    if (!queuedFiles.length) return;

    drainingRef.current = true;
    void processFiles(queuedFiles, 'queue').finally(() => {
      drainingRef.current = false;
    });
  }, [loading, photosLength, queuedFilesLength, processFiles]);

  return {
    addFiles,
    maxActivePhotos: MAX_ACTIVE_PHOTOS,
  };
};
