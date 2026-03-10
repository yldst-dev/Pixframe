import { create } from 'zustand';
import Photo from '../../../core/photo';
import { SafeStorage } from '../../../utils/safe-storage';

type LoadingProgress = {
  current: number;
  total: number;
  currentFileName: string;
};

const DEFAULT_LOADING_PROGRESS: LoadingProgress = {
  current: 0,
  total: 0,
  currentFileName: '',
};

type Store = {
  photos: Photo[];
  setPhotos: (photos: Photo[]) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;
  loadingProgress: LoadingProgress;
  setLoadingProgress: (loadingProgress: LoadingProgress | number) => void;
  resetLoadingProgress: () => void;

  backgroundColor: string;
  setBackgroundColor: (backgroundColor: string) => void;

  ratio: string;
  setRatio: (ratio: string) => void;

  numberOfRow: number;
  setNumberOfRow: (numberOfRow: number) => void;

  numberOfColumn: number;
  setNumberOfColumn: (numberOfColumn: number) => void;

  paddingTop: number;
  setPaddingTop: (paddingTop: number) => void;

  paddingBottom: number;
  setPaddingBottom: (paddingBottom: number) => void;

  paddingLeft: number;
  setPaddingLeft: (paddingLeft: number) => void;

  paddingRight: number;
  setPaddingRight: (paddingRight: number) => void;

  marginEach: number;
  setMarginEach: (marginEach: number) => void;
};

export const useStore = create<Store>((set) => ({
  photos: [],
  setPhotos: (photos) => set({ photos }),

  loading: false,
  setLoading: (loading) => set({ loading, loadingProgress: DEFAULT_LOADING_PROGRESS }),
  loadingProgress: DEFAULT_LOADING_PROGRESS,
  setLoadingProgress: (loadingProgress) =>
    set({
      loadingProgress:
        typeof loadingProgress === 'number'
          ? {
              current: Math.min(100, Math.max(0, Math.round(loadingProgress))),
              total: 100,
              currentFileName: '',
            }
          : loadingProgress,
    }),
  resetLoadingProgress: () => set({ loadingProgress: DEFAULT_LOADING_PROGRESS }),

  backgroundColor: SafeStorage.getItem('lab:backgroundColor', '#ffffff'),
  setBackgroundColor: (backgroundColor) => {
    SafeStorage.setItem('lab:backgroundColor', backgroundColor);
    set({ backgroundColor });
  },

  ratio: SafeStorage.getItem('lab:ratio', '4:5'),
  setRatio: (ratio) => {
    SafeStorage.setItem('lab:ratio', ratio);
    set({ ratio });
  },

  numberOfRow: SafeStorage.getIntItem('lab:numberOfRow', 2),
  setNumberOfRow: (numberOfRow) => {
    SafeStorage.setNumberItem('lab:numberOfRow', numberOfRow);
    set({ numberOfRow });
  },

  numberOfColumn: SafeStorage.getIntItem('lab:numberOfColumn', 2),
  setNumberOfColumn: (numberOfColumn) => {
    SafeStorage.setNumberItem('lab:numberOfColumn', numberOfColumn);
    set({ numberOfColumn });
  },

  paddingTop: SafeStorage.getNumberItem('lab:paddingTop', 50),
  setPaddingTop: (paddingTop) => {
    SafeStorage.setNumberItem('lab:paddingTop', paddingTop);
    set({ paddingTop });
  },

  paddingBottom: SafeStorage.getNumberItem('lab:paddingBottom', 50),
  setPaddingBottom: (paddingBottom) => {
    SafeStorage.setNumberItem('lab:paddingBottom', paddingBottom);
    set({ paddingBottom });
  },

  paddingLeft: SafeStorage.getNumberItem('lab:paddingLeft', 50),
  setPaddingLeft: (paddingLeft) => {
    SafeStorage.setNumberItem('lab:paddingLeft', paddingLeft);
    set({ paddingLeft });
  },

  paddingRight: SafeStorage.getNumberItem('lab:paddingRight', 50),
  setPaddingRight: (paddingRight) => {
    SafeStorage.setNumberItem('lab:paddingRight', paddingRight);
    set({ paddingRight });
  },

  marginEach: SafeStorage.getNumberItem('lab:marginEach', 50),
  setMarginEach: (marginEach) => {
    SafeStorage.setNumberItem('lab:marginEach', marginEach);
    set({ marginEach });
  },
}));
