import { create } from 'zustand';
import Photo from '../core/photo';

const revokePhotoUrls = (photos: Photo[]) => {
  photos.forEach((photo) => {
    const urls = new Set<string>();
    if (photo.image?.src?.startsWith('blob:')) {
      urls.add(photo.image.src);
    }
    if (photo.thumbnail?.startsWith('blob:')) {
      urls.add(photo.thumbnail);
    }
    urls.forEach((url) => URL.revokeObjectURL(url));
  });
};

export interface PhotoState {
  photos: Photo[];
  preview: Photo | null;
  previewPhoto: Photo | null;
  overrideMetadataTarget: Photo | null;
}

export interface PhotoActions {
  setPhotos: (photos: Photo[]) => void;
  addPhoto: (photo: Photo) => void;
  removePhoto: (index: number) => void;
  clearAllPhotos: () => void;
  setPreview: (preview: Photo | null) => void;
  setPreviewPhoto: (previewPhoto: Photo | null) => void;
  setOverrideMetadataTarget: (target: Photo) => void;
}

export type PhotoStore = PhotoState & PhotoActions;

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  preview: null,
  previewPhoto: null,
  overrideMetadataTarget: null,

  setPhotos: (photos: Photo[]) =>
    set((state) => {
      const nextPhotos = new Set(photos);
      const removedPhotos = state.photos.filter((photo) => !nextPhotos.has(photo));
      if (removedPhotos.length > 0) {
        revokePhotoUrls(removedPhotos);
      }
      return { photos };
    }),
  addPhoto: (photo: Photo) =>
    set((state) => ({
      photos: [...state.photos, photo],
    })),
  removePhoto: (index: number) =>
    set((state) => {
      const removedPhoto = state.photos[index];
      if (removedPhoto) {
        revokePhotoUrls([removedPhoto]);
      }
      return {
        photos: state.photos.filter((_, i) => i !== index),
      };
    }),
  clearAllPhotos: () =>
    set((state) => {
      if (state.photos.length > 0) {
        revokePhotoUrls(state.photos);
      }
      return { photos: [] };
    }),
  setPreview: (preview: Photo | null) => set({ preview }),
  setPreviewPhoto: (previewPhoto: Photo | null) => set({ previewPhoto }),
  setOverrideMetadataTarget: (target: Photo) => set({ overrideMetadataTarget: target }),
}));
