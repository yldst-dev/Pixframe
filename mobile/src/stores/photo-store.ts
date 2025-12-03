import { create } from 'zustand';
import Photo from '../core/photo';

/**
 * Photo management state
 * Handles photo collection, selection, and preview
 */
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
  // State
  photos: [],
  preview: null,
  previewPhoto: null,
  overrideMetadataTarget: null,

  // Actions
  setPhotos: (photos: Photo[]) => set({ photos }),
  addPhoto: (photo: Photo) => set((state) => ({ 
    photos: [...state.photos, photo] 
  })),
  removePhoto: (index: number) => set((state) => ({ 
    photos: state.photos.filter((_, i) => i !== index) 
  })),
  clearAllPhotos: () => set({ photos: [] }),
  setPreview: (preview: Photo | null) => set({ preview }),
  setPreviewPhoto: (previewPhoto: Photo | null) => set({ previewPhoto }),
  setOverrideMetadataTarget: (target: Photo) => set({ overrideMetadataTarget: target }),
}));