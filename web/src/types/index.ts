// Core types for the EXIF Frame Web App

import Photo from '../core/photo';

/**
 * Supported languages in the application
 */
export type SupportedLanguage = 'en' | 'ja' | 'ko' | 'zh-CN';

/**
 * Panel position types
 */
export type PanelPosition = 'left' | 'right' | null;

/**
 * Photo interface with extended properties for UI components
 */
export interface PhotoData {
  file: File;
  image: HTMLImageElement;
  imageBase64: string;
  thumbnail: string;
  metadata: ExifMetadataData;
}

/**
 * EXIF Metadata interface
 */
export interface ExifMetadataData {
  make?: string;
  model?: string;
  lensModel?: string;
  focalLength?: string;
  focalLengthIn35mm?: string;
  fNumber?: string;
  iso?: string;
  exposureTime?: string;
  takenAt?: string;
}

/**
 * Override metadata interface
 */
export interface OverrideMetadata {
  [key: string]: string;
}

/**
 * Theme option base interface
 */
export interface ThemeOptionBase {
  id: string;
  description?: string;
  default: any;
}

/**
 * Color theme option
 */
export interface ColorThemeOption extends ThemeOptionBase {
  type: 'color';
  default: string;
}

/**
 * Number theme option
 */
export interface NumberThemeOption extends ThemeOptionBase {
  type: 'number';
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * String theme option
 */
export interface StringThemeOption extends ThemeOptionBase {
  type: 'string';
  default: string;
}

/**
 * Select theme option
 */
export interface SelectThemeOption extends ThemeOptionBase {
  type: 'select';
  default: string;
  options: string[];
}

/**
 * Boolean theme option
 */
export interface BooleanThemeOption extends ThemeOptionBase {
  type: 'boolean';
  default: boolean;
}

/**
 * Range slider theme option
 */
export interface RangeSliderThemeOption extends ThemeOptionBase {
  type: 'range-slider';
  default: number;
  min: number;
  max: number;
  step?: number;
}

/**
 * Union type for all theme option types
 */
export type ThemeOption = 
  | ColorThemeOption 
  | NumberThemeOption 
  | StringThemeOption 
  | SelectThemeOption 
  | BooleanThemeOption 
  | RangeSliderThemeOption;

/**
 * Theme interface
 */
export interface Theme {
  name: string;
  options: ThemeOption[];
  func: (canvas: CanvasRenderingContext2D, photo: Photo, options: Map<string, any>, store: any) => void;
}

/**
 * Component props interfaces
 */
export interface ImagePreviewProps {
  selectedPhoto: Photo | null;
}

export interface ThemeSettingsProps {
  selectedPhoto: Photo | null;
  isMobile?: boolean;
}

/**
 * Store state interface (partial - to be extended)
 */
export interface StoreState {
  tabIndex: number;
  overrideMetadataIndexPopup: boolean;
  overrideMetadataIndex: number | null;
  overridableMetadata: OverrideMetadata[];
  addOverridableMetadataPopup: boolean;
  rerenderOptions: number;
  language: SupportedLanguage;
  darkMode: boolean;
  openedPanel: PanelPosition;
  openedAddPhotoErrorDialog: boolean;
  languagePopover: boolean;
  quality: number;
  dateNotationPopover: boolean;
  dateNotation: string;
  fixImageWidth: number;
  enableFixImageWidth: boolean;
  showCameraMaker: boolean;
  showCameraModel: boolean;
  showLensModel: boolean;
  overrideCameraMaker: string;
  overrideCameraModel: string;
  overrideLensModel: string;
  selectedThemeName: string;
  photos: Photo[];
  loading: boolean;
  overrideMetadataPopup: boolean;
  overrideMetadataTarget: Photo | null;
  fixWatermark: boolean;
  watermark: string;
  exportToJpeg: boolean;
  maintainExif: boolean;
  preview: Photo | null;
  focalLength35mmMode: boolean;
  focalLengthRatioMode: boolean;
  focalLengthRatio: number;
  disableExposureMeter: boolean;
  ratio: string;
  ratioPopover: boolean;
  previewPhoto: Photo | null;
  notCroppedMode: boolean;
}

/**
 * Store actions interface
 */
export interface StoreActions {
  setTabIndex: (tabIndex: number) => void;
  setOverrideMetadataIndexPopup: (opened: boolean) => void;
  setOverrideMetadataIndex: (overrideMetadataIndex: number | null) => void;
  setOverridableMetadata: (overridableMetadata: OverrideMetadata[]) => void;
  setAddOverridableMetadataPopup: (opened: boolean) => void;
  setRerenderOptions: () => void;
  setLanguage: (language: SupportedLanguage) => void;
  setDarkMode: (darkMode: boolean) => void;
  setOpenedPanel: (panel: PanelPosition) => void;
  setOpenedAddPhotoErrorDialog: (opened: boolean) => void;
  setLanguagePopover: (opened: boolean) => void;
  setQuality: (quality: number) => void;
  setDateNotationPopover: (opened: boolean) => void;
  setDateNotation: (dateNotation: string) => void;
  setFixImageWidth: (fixImageWidth: number) => void;
  setEnableFixImageWidth: (enableFixImageWidth: boolean) => void;
  setShowCameraMaker: (showCameraMaker: boolean) => void;
  setShowCameraModel: (showCameraModel: boolean) => void;
  setShowLensModel: (showLensModel: boolean) => void;
  setOverrideCameraMaker: (overrideCameraMaker: string) => void;
  setOverrideCameraModel: (overrideCameraModel: string) => void;
  setOverrideLensModel: (overrideLensModel: string) => void;
  setSelectedThemeName: (name: string) => void;
  setPhotos: (photos: Photo[]) => void;
  addPhoto: (photo: Photo) => void;
  removePhoto: (index: number) => void;
  clearAllPhotos: () => void;
  setLoading: (loading: boolean) => void;
  setOverrideMetadataPopup: (opened: boolean) => void;
  setOverrideMetadataTarget: (target: Photo) => void;
  setFixWatermark: (fixWatermark: boolean) => void;
  setWatermark: (watermark: string) => void;
  setExportToJpeg: (exportToJpeg: boolean) => void;
  setMaintainExif: (maintainExif: boolean) => void;
  setPreview: (preview: Photo | null) => void;
  setFocalLength35mmMode: (focalLength35mmMode: boolean) => void;
  setFocalLengthRatioMode: (focalLengthRatioMode: boolean) => void;
  setFocalLengthRatio: (focalLengthRatio: number) => void;
  setDisableExposureMeter: (disableExposureMeter: boolean) => void;
  setRatio: (ratio: string) => void;
  setRatioPopover: (opened: boolean) => void;
  setPreviewPhoto: (previewPhoto: Photo | null) => void;
  setNotCroppedMode: (notCroppedMode: boolean) => void;
}

/**
 * Combined Store interface
 */
export interface Store extends StoreState, StoreActions {}

/**
 * Error types
 */
export class LocalStorageError extends Error {
  constructor(message: string, public readonly key?: string) {
    super(message);
    this.name = 'LocalStorageError';
  }
}