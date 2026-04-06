import { create } from 'zustand';
import { PanelPosition } from '../types';
import { SafeStorage } from '../utils/safe-storage';

export interface LoadingProgress {
  current: number;
  total: number;
  currentFileName: string;
}

export interface PhotoQueueNotice {
  acceptedCount: number;
  queuedCount: number;
  queueTotal: number;
  activeLimit: number;
}

const DEFAULT_LOADING_PROGRESS: LoadingProgress = {
  current: 0,
  total: 0,
  currentFileName: '',
};

export interface UIState {
  tabIndex: number;
  openedPanel: PanelPosition;
  overrideMetadataIndexPopup: boolean;
  addOverridableMetadataPopup: boolean;
  openedAddPhotoErrorDialog: boolean;
  languagePopover: boolean;
  dateNotationPopover: boolean;
  ratioPopover: boolean;
  overrideMetadataPopup: boolean;
  loading: boolean;
  loadingProgress: LoadingProgress;
  photoQueueNotice: PhotoQueueNotice | null;
  darkMode: boolean;
}

export interface UIActions {
  setTabIndex: (tabIndex: number) => void;
  setOpenedPanel: (panel: PanelPosition) => void;
  setOverrideMetadataIndexPopup: (opened: boolean) => void;
  setAddOverridableMetadataPopup: (opened: boolean) => void;
  setOpenedAddPhotoErrorDialog: (opened: boolean) => void;
  setLanguagePopover: (opened: boolean) => void;
  setDateNotationPopover: (opened: boolean) => void;
  setRatioPopover: (opened: boolean) => void;
  setOverrideMetadataPopup: (opened: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (loadingProgress: LoadingProgress | number) => void;
  resetLoadingProgress: () => void;
  setPhotoQueueNotice: (notice: PhotoQueueNotice | null) => void;
  setDarkMode: (darkMode: boolean) => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  tabIndex: 0,
  openedPanel: null,
  overrideMetadataIndexPopup: false,
  addOverridableMetadataPopup: false,
  openedAddPhotoErrorDialog: false,
  languagePopover: false,
  dateNotationPopover: false,
  ratioPopover: false,
  overrideMetadataPopup: false,
  loading: false,
  loadingProgress: DEFAULT_LOADING_PROGRESS,
  photoQueueNotice: null,
  darkMode: SafeStorage.getBooleanItem('darkMode', false),

  setTabIndex: (tabIndex: number) => set({ tabIndex }),
  setOpenedPanel: (panel: PanelPosition) => set({ openedPanel: panel }),
  setOverrideMetadataIndexPopup: (opened: boolean) => set({ overrideMetadataIndexPopup: opened }),
  setAddOverridableMetadataPopup: (opened: boolean) => set({ addOverridableMetadataPopup: opened }),
  setOpenedAddPhotoErrorDialog: (opened: boolean) => set({ openedAddPhotoErrorDialog: opened }),
  setLanguagePopover: (opened: boolean) => set({ languagePopover: opened }),
  setDateNotationPopover: (opened: boolean) => set({ dateNotationPopover: opened }),
  setRatioPopover: (opened: boolean) => set({ ratioPopover: opened }),
  setOverrideMetadataPopup: (opened: boolean) => set({ overrideMetadataPopup: opened }),
  setLoading: (loading: boolean) => set({ loading, loadingProgress: DEFAULT_LOADING_PROGRESS }),
  setLoadingProgress: (loadingProgress: LoadingProgress | number) =>
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
  setPhotoQueueNotice: (notice: PhotoQueueNotice | null) => set({ photoQueueNotice: notice }),
  setDarkMode: (darkMode: boolean) =>
    set(() => {
      try {
        document.getElementById('theme')!.className = darkMode ? 'dark' : 'light';
        SafeStorage.setBooleanItem('darkMode', darkMode);
      } catch (error) {
        console.error('Failed to update dark mode:', error);
      }
      return { darkMode };
    }),
}));

try {
  const initialDarkMode = useUIStore.getState().darkMode;
  document.getElementById('theme')!.className = initialDarkMode ? 'dark' : 'light';
} catch (error) {
  console.error('Failed to initialize dark mode:', error);
}
