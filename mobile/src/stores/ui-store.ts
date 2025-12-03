import { create } from 'zustand';
import { PanelPosition } from '../types';
import { SafeStorage } from '../utils/safe-storage';

/**
 * UI-related state management
 * Handles tabs, panels, popups, and language settings
 */
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
  setDarkMode: (darkMode: boolean) => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // State
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
  darkMode: SafeStorage.getBooleanItem('darkMode', false),

  // Actions
  setTabIndex: (tabIndex: number) => set({ tabIndex }),
  setOpenedPanel: (panel: PanelPosition) => set({ openedPanel: panel }),
  setOverrideMetadataIndexPopup: (opened: boolean) => set({ overrideMetadataIndexPopup: opened }),
  setAddOverridableMetadataPopup: (opened: boolean) => set({ addOverridableMetadataPopup: opened }),
  setOpenedAddPhotoErrorDialog: (opened: boolean) => set({ openedAddPhotoErrorDialog: opened }),
  setLanguagePopover: (opened: boolean) => set({ languagePopover: opened }),
  setDateNotationPopover: (opened: boolean) => set({ dateNotationPopover: opened }),
  setRatioPopover: (opened: boolean) => set({ ratioPopover: opened }),
  setOverrideMetadataPopup: (opened: boolean) => set({ overrideMetadataPopup: opened }),
  setLoading: (loading: boolean) => set({ loading }),
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

// Initialize dark mode on load
try {
  const initialDarkMode = useUIStore.getState().darkMode;
  document.getElementById('theme')!.className = initialDarkMode ? 'dark' : 'light';
} catch (error) {
  console.error('Failed to initialize dark mode:', error);
}