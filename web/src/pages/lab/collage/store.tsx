import { create } from 'zustand';
import Photo from '../../../core/photo';

export interface LoadingProgress {
  current: number;
  total: number;
  currentFileName: string;
}

const DEFAULT_LOADING_PROGRESS: LoadingProgress = {
  current: 0,
  total: 0,
  currentFileName: '',
};

const getStoredNumber = (key: string, fallback: number, min?: number): number => {
  const rawValue = localStorage.getItem(key);
  const parsedValue = rawValue ? Number(rawValue) : fallback;
  const value = Number.isFinite(parsedValue) ? parsedValue : fallback;
  return min === undefined ? value : Math.max(value, min);
};

const setStoredNumber = (key: string, value: number, min?: number): number => {
  const nextValue = min === undefined ? value : Math.max(value, min);
  localStorage.setItem(key, String(nextValue));
  return nextValue;
};

type Store = {
  photos: Photo[];
  setPhotos: (photos: Photo[]) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  loadingProgress: LoadingProgress;
  setLoadingProgress: (progress: LoadingProgress) => void;
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
  setLoading: (loading) => set({ loading }),

  loadingProgress: DEFAULT_LOADING_PROGRESS,
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  resetLoadingProgress: () => set({ loadingProgress: DEFAULT_LOADING_PROGRESS }),

  backgroundColor: localStorage.getItem('lab:backgroundColor') || '#ffffff',
  setBackgroundColor: (backgroundColor) => {
    localStorage.setItem('lab:backgroundColor', backgroundColor);
    set({ backgroundColor });
  },

  ratio: localStorage.getItem('lab:ratio') || '4:5',
  setRatio: (ratio) => {
    localStorage.setItem('lab:ratio', ratio);
    set({ ratio });
  },

  numberOfRow: getStoredNumber('lab:numberOfRow', 2, 1),
  setNumberOfRow: (numberOfRow) => {
    const nextValue = setStoredNumber('lab:numberOfRow', numberOfRow, 1);
    set({ numberOfRow: nextValue });
  },

  numberOfColumn: getStoredNumber('lab:numberOfColumn', 2, 1),
  setNumberOfColumn: (numberOfColumn) => {
    const nextValue = setStoredNumber('lab:numberOfColumn', numberOfColumn, 1);
    set({ numberOfColumn: nextValue });
  },

  paddingTop: getStoredNumber('lab:paddingTop', 50, 0),
  setPaddingTop: (paddingTop) => {
    const nextValue = setStoredNumber('lab:paddingTop', paddingTop, 0);
    set({ paddingTop: nextValue });
  },

  paddingBottom: getStoredNumber('lab:paddingBottom', 50, 0),
  setPaddingBottom: (paddingBottom) => {
    const nextValue = setStoredNumber('lab:paddingBottom', paddingBottom, 0);
    set({ paddingBottom: nextValue });
  },

  paddingLeft: getStoredNumber('lab:paddingLeft', 50, 0),
  setPaddingLeft: (paddingLeft) => {
    const nextValue = setStoredNumber('lab:paddingLeft', paddingLeft, 0);
    set({ paddingLeft: nextValue });
  },

  paddingRight: getStoredNumber('lab:paddingRight', 50, 0),
  setPaddingRight: (paddingRight) => {
    const nextValue = setStoredNumber('lab:paddingRight', paddingRight, 0);
    set({ paddingRight: nextValue });
  },

  marginEach: getStoredNumber('lab:marginEach', 50, 0),
  setMarginEach: (marginEach) => {
    const nextValue = setStoredNumber('lab:marginEach', marginEach, 0);
    set({ marginEach: nextValue });
  },
}));
