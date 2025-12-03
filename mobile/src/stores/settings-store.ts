import { create } from 'zustand';
import { SupportedLanguage, OverrideMetadata } from '../types';
import { SafeStorage } from '../utils/safe-storage';
import themes from '../themes';

/**
 * Application settings state
 * Handles export settings, metadata configuration, and user preferences
 */
export interface SettingsState {
  // Language and localization
  language: SupportedLanguage;
  dateNotation: string;

  // Export settings
  quality: number;
  exportToJpeg: boolean;
  maintainExif: boolean;
  fixImageWidth: number;
  enableFixImageWidth: boolean;
  ratio: string;
  notCroppedMode: boolean;

  // Camera and lens settings
  showCameraMaker: boolean;
  showCameraModel: boolean;
  showLensModel: boolean;
  overrideCameraMaker: string;
  overrideCameraModel: string;
  overrideLensModel: string;

  // EXIF and metadata
  focalLength35mmMode: boolean;
  focalLengthRatioMode: boolean;
  focalLengthRatio: number;
  disableExposureMeter: boolean;
  overrideMetadataIndex: number | null;
  overridableMetadata: OverrideMetadata[];

  // Watermark
  fixWatermark: boolean;
  watermark: string;

  // Theme
  selectedThemeName: string;
  
  // Render trigger
  rerenderOptions: number;
}

export interface SettingsActions {
  setLanguage: (language: SupportedLanguage) => void;
  setDateNotation: (dateNotation: string) => void;
  setQuality: (quality: number) => void;
  setExportToJpeg: (exportToJpeg: boolean) => void;
  setMaintainExif: (maintainExif: boolean) => void;
  setFixImageWidth: (fixImageWidth: number) => void;
  setEnableFixImageWidth: (enableFixImageWidth: boolean) => void;
  setRatio: (ratio: string) => void;
  setNotCroppedMode: (notCroppedMode: boolean) => void;
  setShowCameraMaker: (showCameraMaker: boolean) => void;
  setShowCameraModel: (showCameraModel: boolean) => void;
  setShowLensModel: (showLensModel: boolean) => void;
  setOverrideCameraMaker: (overrideCameraMaker: string) => void;
  setOverrideCameraModel: (overrideCameraModel: string) => void;
  setOverrideLensModel: (overrideLensModel: string) => void;
  setFocalLength35mmMode: (focalLength35mmMode: boolean) => void;
  setFocalLengthRatioMode: (focalLengthRatioMode: boolean) => void;
  setFocalLengthRatio: (focalLengthRatio: number) => void;
  setDisableExposureMeter: (disableExposureMeter: boolean) => void;
  setOverrideMetadataIndex: (overrideMetadataIndex: number | null) => void;
  setOverridableMetadata: (overridableMetadata: OverrideMetadata[]) => void;
  setFixWatermark: (fixWatermark: boolean) => void;
  setWatermark: (watermark: string) => void;
  setSelectedThemeName: (name: string) => void;
  setRerenderOptions: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set) => ({
  // State with safe localStorage access
  language: SafeStorage.getItem('language', 'en') as SupportedLanguage,
  dateNotation: SafeStorage.getItem('dateNotation', '2001/01/01 01:01:01'),
  quality: SafeStorage.getNumberItem('quality', 0.95),
  exportToJpeg: SafeStorage.getBooleanItem('exportToJpeg', false),
  maintainExif: SafeStorage.getBooleanItem('maintainExif', true),
  fixImageWidth: SafeStorage.getIntItem('fixImageWidth', 1920),
  enableFixImageWidth: SafeStorage.getBooleanItem('enableFixImageWidth', false),
  ratio: SafeStorage.getItem('ratio', 'free'),
  notCroppedMode: SafeStorage.getBooleanItem('notCroppedMode', false),
  showCameraMaker: SafeStorage.getBooleanItem('showCameraMaker', true),
  showCameraModel: SafeStorage.getBooleanItem('showCameraModel', true),
  showLensModel: SafeStorage.getBooleanItem('showLensModel', true),
  overrideCameraMaker: SafeStorage.getItem('overrideCameraMaker', ''),
  overrideCameraModel: SafeStorage.getItem('overrideCameraModel', ''),
  overrideLensModel: SafeStorage.getItem('overrideLensModel', ''),
  focalLength35mmMode: SafeStorage.getBooleanItem('focalLength35mmMode', false),
  focalLengthRatioMode: SafeStorage.getBooleanItem('focalLengthRatioMode', false),
  focalLengthRatio: SafeStorage.getNumberItem('focalLengthRatio', 1),
  disableExposureMeter: SafeStorage.getBooleanItem('disableExposureMeter', false),
  overrideMetadataIndex: SafeStorage.getItem('overrideMetadataIndex', '') ? SafeStorage.getIntItem('overrideMetadataIndex') : null,
  overridableMetadata: SafeStorage.getJSONItem('overridableMetadata', []),
  fixWatermark: SafeStorage.getBooleanItem('fixWatermark', false),
  watermark: SafeStorage.getItem('watermark', ''),
  selectedThemeName: (() => {
    const savedTheme = SafeStorage.getItem('selectedThemeName', '');
    return themes.find(theme => theme.name === savedTheme)?.name || 'No frame';
  })(),
  rerenderOptions: 0,

  // Actions with safe localStorage persistence
  setLanguage: (language: SupportedLanguage) =>
    set(() => {
      SafeStorage.setItem('language', language);
      return { language };
    }),

  setDateNotation: (dateNotation: string) =>
    set(() => {
      SafeStorage.setItem('dateNotation', dateNotation);
      return { dateNotation };
    }),

  setQuality: (quality: number) =>
    set(() => {
      SafeStorage.setNumberItem('quality', quality);
      return { quality };
    }),

  setExportToJpeg: (exportToJpeg: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('exportToJpeg', exportToJpeg);
      return { exportToJpeg };
    }),

  setMaintainExif: (maintainExif: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('maintainExif', maintainExif);
      return { maintainExif };
    }),

  setFixImageWidth: (fixImageWidth: number) =>
    set(() => {
      if (fixImageWidth > 4096) fixImageWidth = 4096;
      SafeStorage.setNumberItem('fixImageWidth', fixImageWidth);
      return { fixImageWidth: fixImageWidth || 1920 };
    }),

  setEnableFixImageWidth: (enableFixImageWidth: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('enableFixImageWidth', enableFixImageWidth);
      return { enableFixImageWidth };
    }),

  setRatio: (ratio: string) =>
    set(() => {
      SafeStorage.setItem('ratio', ratio);
      return { ratio };
    }),

  setNotCroppedMode: (notCroppedMode: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('notCroppedMode', notCroppedMode);
      return { notCroppedMode };
    }),

  setShowCameraMaker: (showCameraMaker: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('showCameraMaker', showCameraMaker);
      return { showCameraMaker };
    }),

  setShowCameraModel: (showCameraModel: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('showCameraModel', showCameraModel);
      return { showCameraModel };
    }),

  setShowLensModel: (showLensModel: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('showLensModel', showLensModel);
      return { showLensModel };
    }),

  setOverrideCameraMaker: (overrideCameraMaker: string) =>
    set(() => {
      SafeStorage.setItem('overrideCameraMaker', overrideCameraMaker);
      return { overrideCameraMaker };
    }),

  setOverrideCameraModel: (overrideCameraModel: string) =>
    set(() => {
      SafeStorage.setItem('overrideCameraModel', overrideCameraModel);
      return { overrideCameraModel };
    }),

  setOverrideLensModel: (overrideLensModel: string) =>
    set(() => {
      SafeStorage.setItem('overrideLensModel', overrideLensModel);
      return { overrideLensModel };
    }),

  setFocalLength35mmMode: (focalLength35mmMode: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('focalLength35mmMode', focalLength35mmMode);
      return { focalLength35mmMode };
    }),

  setFocalLengthRatioMode: (focalLengthRatioMode: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('focalLengthRatioMode', focalLengthRatioMode);
      return { focalLengthRatioMode };
    }),

  setFocalLengthRatio: (focalLengthRatio: number) =>
    set(() => {
      SafeStorage.setNumberItem('focalLengthRatio', focalLengthRatio);
      return { focalLengthRatio };
    }),

  setDisableExposureMeter: (disableExposureMeter: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('disableExposureMeter', disableExposureMeter);
      return { disableExposureMeter };
    }),

  setOverrideMetadataIndex: (overrideMetadataIndex: number | null) =>
    set(() => {
      SafeStorage.setItem('overrideMetadataIndex', overrideMetadataIndex?.toString() || '');
      return { overrideMetadataIndex };
    }),

  setOverridableMetadata: (overridableMetadata: OverrideMetadata[]) =>
    set(() => {
      SafeStorage.setJSONItem('overridableMetadata', overridableMetadata);
      return { overridableMetadata };
    }),

  setFixWatermark: (fixWatermark: boolean) =>
    set(() => {
      SafeStorage.setBooleanItem('fixWatermark', fixWatermark);
      return { fixWatermark };
    }),

  setWatermark: (watermark: string) =>
    set(() => {
      SafeStorage.setItem('watermark', watermark);
      return { watermark };
    }),

  setSelectedThemeName: (selectedThemeName: string) =>
    set(() => {
      SafeStorage.setItem('selectedThemeName', selectedThemeName);
      return { selectedThemeName };
    }),

  setRerenderOptions: () => set({ rerenderOptions: Math.random() }),
}));