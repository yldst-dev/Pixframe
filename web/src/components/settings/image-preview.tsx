import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ImageIcon from '../../icons/image.icon';
import Button from '../ui/button';
import IconButton from '../ui/icon-button';
import PfLoader from '../ui/pf-loader';
import TrashIcon from '../../icons/trash.icon';
import { useStore } from '../../store';
import themes, { useThemeStore } from '../../themes';
import render from '../../core/drawing/render';
import free from '../../core/drawing/free';
import download from '../../core/file-system/download';
import { createObjectUrl, revokeObjectUrl } from '../../core/export/blob';
import { encodeCanvas } from '../../core/export/encode';
import { buildThemedFileName, resolveExportFormat } from '../../core/export/format';
import { exportRenderedCanvas } from '../../core/export/rendered-export';
import { resolveThemeOptions } from '../../core/export/theme-options';
import { useDebounce } from '../../hooks/useDebounce';
import { ImagePreviewProps } from '../../types';
import DownloadSettingsModal from './download-settings-modal';
import { IoCheckmarkCircle, IoDownloadOutline } from 'react-icons/io5';

const PREVIEW_CACHE_LIMIT = 24;

const ImagePreview: React.FC<ImagePreviewProps> = ({ selectedPhoto }) => {
  const { t } = useTranslation();
  const store = useStore();
  const {
    darkMode,
    selectedThemeName,
    exportToJpeg,
    quality,
    maintainExif,
    photos,
    themeDarkMode,
    fixWatermark,
    watermark,
    enableFixImageWidth,
    fixImageWidth,
    disableExposureMeter,
    ratio,
    notCroppedMode,
    showCameraMaker,
    showCameraModel,
    showLensModel,
    overrideCameraMaker,
    overrideCameraModel,
    overrideLensModel,
    rerenderOptions,
    setRerenderOptions,
  } = store;
  const themeStore = useThemeStore();
  const [themedPreview, setThemedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDownloadSettings, setShowDownloadSettings] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  const previewCacheRef = useRef<Map<string, string>>(new Map());
  const previewCacheOrderRef = useRef<string[]>([]);
  const generationIdRef = useRef(0);
  const renderStoreRef = useRef(store);
  const downloadSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    renderStoreRef.current = store;
  }, [store]);

  const debouncedThemeOptions = useDebounce(themeStore.option, 300);

  const themeOptionSignature = useMemo(() => {
    return JSON.stringify(
      Array.from(debouncedThemeOptions.entries()).sort(([keyA], [keyB]) =>
        keyA.localeCompare(keyB)
      )
    );
  }, [debouncedThemeOptions]);

  const renderSettingSignature = useMemo(() => {
    return JSON.stringify({
      selectedThemeName,
      themeDarkMode,
      fixWatermark,
      watermark,
      enableFixImageWidth,
      fixImageWidth,
      disableExposureMeter,
      ratio,
      notCroppedMode,
      showCameraMaker,
      showCameraModel,
      showLensModel,
      overrideCameraMaker,
      overrideCameraModel,
      overrideLensModel,
      exportToJpeg,
      quality,
      rerenderOptions,
    });
  }, [
    selectedThemeName,
    themeDarkMode,
    fixWatermark,
    watermark,
    enableFixImageWidth,
    fixImageWidth,
    disableExposureMeter,
    ratio,
    notCroppedMode,
    showCameraMaker,
    showCameraModel,
    showLensModel,
    overrideCameraMaker,
    overrideCameraModel,
    overrideLensModel,
    exportToJpeg,
    quality,
    rerenderOptions,
  ]);

  const previewCacheKey = useMemo(() => {
    if (!selectedPhoto || !selectedThemeName) {
      return '';
    }

    return [
      selectedPhoto.file.name,
      selectedPhoto.file.size,
      selectedPhoto.file.lastModified,
      selectedThemeName,
      themeOptionSignature,
      renderSettingSignature,
    ].join('::');
  }, [selectedPhoto, selectedThemeName, themeOptionSignature, renderSettingSignature]);

  const cachePreview = useCallback((cacheKey: string, preview: string) => {
    const cache = previewCacheRef.current;
    const order = previewCacheOrderRef.current;
    const existingPreview = cache.get(cacheKey);

    const existingIndex = order.indexOf(cacheKey);
    if (existingIndex >= 0) {
      order.splice(existingIndex, 1);
    }

    if (existingPreview && existingPreview !== preview) {
      revokeObjectUrl(existingPreview);
    }

    cache.set(cacheKey, preview);
    order.push(cacheKey);

    while (order.length > PREVIEW_CACHE_LIMIT) {
      const oldest = order.shift();
      if (!oldest) {
        break;
      }
      revokeObjectUrl(cache.get(oldest));
      cache.delete(oldest);
    }
  }, []);

  const clearPreviewCache = useCallback(() => {
    previewCacheRef.current.forEach((preview) => {
      revokeObjectUrl(preview);
    });
    previewCacheRef.current.clear();
    previewCacheOrderRef.current = [];
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  useEffect(() => {
    if (!selectedPhoto || !selectedThemeName) {
      setThemedPreview(null);
      setIsGenerating(false);
      setGenerationError(null);
      return;
    }

    const cachedPreview = previewCacheRef.current.get(previewCacheKey);
    if (cachedPreview) {
      setThemedPreview(cachedPreview);
      setIsGenerating(false);
      setGenerationError(null);
      return;
    }

    const generationId = generationIdRef.current + 1;
    generationIdRef.current = generationId;
    setThemedPreview(null);
    setGenerationError(null);
    setIsGenerating(true);

    const generate = async () => {
      let previewUrl: string | null = null;
      try {
        const selectedTheme = themes.find((theme) => theme.name === selectedThemeName);
        if (!selectedTheme) {
          throw new Error(`Theme "${selectedThemeName}" not found`);
        }

        const themeOptions = resolveThemeOptions(selectedTheme.options, debouncedThemeOptions);

        await new Promise((resolve) => requestAnimationFrame(resolve));

        const canvas = await render(selectedTheme.func, selectedPhoto, themeOptions, renderStoreRef.current);
        try {
          if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Generated canvas is invalid');
          }

          previewUrl = createObjectUrl(await encodeCanvas(canvas, resolveExportFormat(exportToJpeg), quality));

          if (generationIdRef.current !== generationId) {
            revokeObjectUrl(previewUrl);
            return;
          }

          cachePreview(previewCacheKey, previewUrl);
          setThemedPreview(previewUrl);
        } finally {
          free(canvas);
        }
      } catch (error) {
        if (generationIdRef.current !== generationId) {
          return;
        }
        console.error('Failed to generate export preview:', error);
        setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
        setThemedPreview(null);
      } finally {
        if (generationIdRef.current === generationId) {
          setIsGenerating(false);
        }
      }
    };

    void generate();
  }, [
    selectedPhoto,
    selectedThemeName,
    debouncedThemeOptions,
    previewCacheKey,
    cachePreview,
    exportToJpeg,
    quality,
  ]);

  const handleImageClick = useCallback(() => {
    if (!themedPreview) {
      return;
    }
    setShowModal(true);
  }, [themedPreview]);

  const triggerDownloadSuccess = useCallback(() => {
    if (downloadSuccessTimerRef.current) {
      clearTimeout(downloadSuccessTimerRef.current);
    }
    setShowDownloadSuccess(true);
    downloadSuccessTimerRef.current = setTimeout(() => {
      setShowDownloadSuccess(false);
      downloadSuccessTimerRef.current = null;
    }, 2000);
  }, []);

  const handleOpenDownloadSettings = useCallback(() => {
    if (!selectedPhoto || !selectedThemeName) return;
    setShowDownloadSettings(true);
  }, [selectedPhoto, selectedThemeName]);

  const handleConfirmDownload = useCallback(async () => {
    if (!selectedPhoto || !selectedThemeName || isDownloading) return;
    setIsDownloading(true);
    setShowDownloadSettings(false);
    try {
      const selectedTheme = themes.find((theme) => theme.name === selectedThemeName);
      if (!selectedTheme) {
        throw new Error(`Theme "${selectedThemeName}" not found`);
      }

      const themeOptions = resolveThemeOptions(selectedTheme.options, themeStore.option);

      const canvas = await render(selectedTheme.func, selectedPhoto, themeOptions, renderStoreRef.current);
      try {
        const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();
        const result = await exportRenderedCanvas(canvas, {
          fallbackMetadata: selectedPhoto.metadata,
          format: resolveExportFormat(exportToJpeg),
          maintainExif,
          quality,
          sourceFile: selectedPhoto.file,
        });
        await download(buildThemedFileName(selectedPhoto.file.name, themeName, result.format.extension), result.blob);
        triggerDownloadSuccess();
      } finally {
        free(canvas);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert(t('error.download_failed', 'Download failed. Please try again.'));
    } finally {
      setIsDownloading(false);
    }
  }, [
    isDownloading,
    selectedPhoto,
    selectedThemeName,
    themeStore.option,
    exportToJpeg,
    quality,
    maintainExif,
    t,
    triggerDownloadSuccess,
  ]);

  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowModal(false);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [showModal, handleEscKey]);

  useEffect(() => {
    return () => {
      if (downloadSuccessTimerRef.current) {
        clearTimeout(downloadSuccessTimerRef.current);
      }
      clearPreviewCache();
    };
  }, [clearPreviewCache]);

  const previewInfo = useMemo(() => {
    if (!selectedPhoto) return null;

    return {
      originalSize: `${selectedPhoto.image.naturalWidth} × ${selectedPhoto.image.naturalHeight}`,
      outputSize: `${selectedPhoto.image.width} × ${selectedPhoto.image.height}`,
      fileSize: formatFileSize(selectedPhoto.file.size),
    };
  }, [selectedPhoto, formatFileSize]);

  if (!selectedPhoto) {
    return (
      <div className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
            <ImageIcon size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">{t('preview.no-selection', 'No Image Selected')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('preview.select-instruction', 'Select an image from the grid to see the export preview')}</p>
          </div>
        </div>
      </div>
    );
  }

  const previewSrc = themedPreview || selectedPhoto.image.src;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col p-0 min-h-0">
        <div
          className="flex-1 bg-gray-100 dark:bg-gray-800 overflow-hidden min-h-0 image-preview-container"
          style={{
            backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.8)',
          }}
        >
          {previewSrc ? (
            <div className="w-full h-full p-0 image-preview-container relative">
              <img
                src={previewSrc}
                alt={`Export preview - ${selectedPhoto.file.name}`}
                className={`max-w-full max-h-full object-contain ${themedPreview ? 'hover:opacity-90 cursor-pointer' : ''}`}
                onClick={handleImageClick}
                loading="lazy"
                decoding="async"
              />
              {isGenerating && !themedPreview && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-xs rounded-md">
                    <PfLoader className="w-4 h-4" />
                    <span>{t('preview.generating', '미리보기 생성 중...')}</span>
                  </div>
                </div>
              )}
            </div>
          ) : generationError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">{t('preview.generation-error', 'Preview generation failed')}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{generationError}</p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setGenerationError(null);
                    setRerenderOptions();
                  }}
                  className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                >
                  {t('preview.retry', 'Try Again')}
                </button>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <PfLoader className="w-10 h-10 text-blue-500 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('preview.generating', '미리보기 생성 중...')}</p>
                  {selectedThemeName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedThemeName}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('preview.waiting', 'Select a theme to see preview')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 space-y-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="space-y-2 text-sm">
          <div className="font-medium text-gray-900 dark:text-white truncate" title={selectedPhoto.file.name}>
            {selectedPhoto.file.name}
          </div>

          {previewInfo && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>{t('preview.original-size', 'Original Size')}:</span>
                <span className="font-mono">{previewInfo.originalSize}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('preview.output-size', 'Output Size')}:</span>
                <span className="font-mono">{previewInfo.outputSize}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('preview.file-size', 'File Size')}:</span>
                <span className="font-mono">{previewInfo.fileSize}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="primary"
            className={`flex-1 !transition-[background-color,color,border-color] !duration-500 !ease-[cubic-bezier(0.4,0,0.2,1)] ${showDownloadSuccess ? '!bg-emerald-500 !border-emerald-500 !text-white' : ''}`}
            disabled={!themedPreview}
            onClick={handleOpenDownloadSettings}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <span className="relative block h-4 w-4">
                <IoDownloadOutline
                  className={`absolute inset-0 h-4 w-4 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${showDownloadSuccess ? 'scale-50 opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0'}`}
                />
                <IoCheckmarkCircle
                  key={showDownloadSuccess ? 'success' : 'idle'}
                  className="absolute inset-0 h-4 w-4 text-white"
                  style={showDownloadSuccess ? { animation: 'pf-success-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' } : { opacity: 0 }}
                />
              </span>
              {showDownloadSuccess
                ? t('preview.download-complete', '다운로드 완료')
                : themedPreview
                  ? t('preview.download-single', '이 사진 다운로드')
                  : t('preview.generating', '생성 중...')}
            </span>
          </Button>

          <IconButton
            variant="ghost"
            className="h-10 w-10 !bg-red-50 !text-red-600 !border-red-100 rounded-md transition-none hover:!bg-red-50 active:!bg-red-50 focus:!bg-red-50 focus:!ring-0"
            disabled={!selectedPhoto}
            onClick={() => {
              const event = new CustomEvent('delete-current-photo', {
                detail: { index: photos.indexOf(selectedPhoto) },
              });
              window.dispatchEvent(event);
            }}
          >
            <TrashIcon size={20} />
          </IconButton>
        </div>
      </div>

      {showModal && themedPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="relative flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={themedPreview}
              alt={`Full preview - ${selectedPhoto.file.name}`}
              className="object-contain shadow-2xl"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto',
              }}
            />
          </div>
        </div>
      )}
      <DownloadSettingsModal
        isOpen={showDownloadSettings}
        onClose={() => setShowDownloadSettings(false)}
        onConfirm={handleConfirmDownload}
        confirmLabel={t('preview.download-single', '이 사진 다운로드')}
        isConfirmDisabled={!selectedPhoto || !selectedThemeName}
        isConfirmLoading={isDownloading}
      />
    </div>
  );
};

export default ImagePreview;
