import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ImageIcon from '../../icons/image.icon';
import Button from '../ui/button';
import { useStore } from '../../store';
import PfLoader from '../ui/pf-loader';
import themes, { useThemeStore } from '../../themes';
import render from '../../core/drawing/render';
import free from '../../core/drawing/free';
import { useDebounce } from '../../hooks/useDebounce';
import { ImagePreviewProps } from '../../types';
import TrashIcon from '../../icons/trash.icon';
import IconButton from '../ui/icon-button';
import { IoCheckmarkCircle, IoDownloadOutline } from 'react-icons/io5';
import download from '../../core/file-system/download';
import { createObjectUrl, revokeObjectUrl } from '../../core/export/blob';
import { encodeCanvas } from '../../core/export/encode';
import { buildThemedFileName, resolveExportFormat } from '../../core/export/format';
import { resolveThemeOptions } from '../../core/export/theme-options';
import { showToast } from '../../core/toast';

const PREVIEW_CACHE_LIMIT = 24;

const ImagePreview: React.FC<ImagePreviewProps> = ({ selectedPhoto }) => {
  const { t } = useTranslation();
  const store = useStore();
  const {
    selectedThemeName,
    quality,
    exportToJpeg,
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
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  const downloadSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewCacheRef = useRef<Map<string, string>>(new Map());
  const previewCacheOrderRef = useRef<string[]>([]);
  const generationIdRef = useRef(0);
  const renderStoreRef = useRef(store);

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
      exportToJpeg,
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
      quality,
      rerenderOptions,
    });
  }, [
    selectedThemeName,
    exportToJpeg,
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

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

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
  }, [selectedPhoto, selectedThemeName, debouncedThemeOptions, previewCacheKey, cachePreview, exportToJpeg, quality]);

  const handleImageClick = useCallback(() => {
    if (!themedPreview) {
      return;
    }
    setShowModal(true);
  }, [themedPreview]);

  const handleDownloadClick = useCallback(async () => {
    if (!selectedPhoto || !selectedThemeName) return;

    try {
      const selectedTheme = themes.find((theme) => theme.name === selectedThemeName);
      if (!selectedTheme) {
        throw new Error(`Theme "${selectedThemeName}" not found`);
      }

      const themeOptions = resolveThemeOptions(selectedTheme.options, themeStore.option);
      const canvas = await render(selectedTheme.func, selectedPhoto, themeOptions, renderStoreRef.current);
      try {
        const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();
        const format = resolveExportFormat(exportToJpeg);
        const blob = await encodeCanvas(canvas, format, quality);
        await download(buildThemedFileName(selectedPhoto.file.name, themeName, format.extension), blob);
      } finally {
        free(canvas);
      }

      triggerDownloadSuccess();
      showToast(t('root.successfully-downloaded-in-gallery'));
    } catch (error) {
      console.error('Download failed:', error);
      showToast({
        message: t('error.download_failed', 'Download failed. Please try again.'),
        variant: 'error',
      });
    }
  }, [selectedPhoto, selectedThemeName, themeStore.option, exportToJpeg, quality, t, triggerDownloadSuccess]);

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
          <div className="p-4 bg-muted text-muted-foreground rounded-full">
            <ImageIcon size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{t('preview.no-selection', 'No Image Selected')}</h3>
            <p className="text-sm text-muted-foreground">{t('preview.select-instruction', 'Select an image from the grid to see the export preview')}</p>
          </div>
        </div>
      </div>
    );
  }

  const previewSrc = themedPreview || selectedPhoto.image.src;

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="flex-1 flex flex-col p-0 min-h-0">
        <div className="flex-1 bg-muted/80 overflow-hidden min-h-0 image-preview-container">
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
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">{t('preview.generation-error', 'Preview generation failed')}</p>
                  <p className="text-xs text-destructive/80">{generationError}</p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setGenerationError(null);
                    setRerenderOptions();
                  }}
                  className="text-xs px-3 py-1 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors"
                >
                  {t('preview.retry', 'Try Again')}
                </button>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <PfLoader className="w-10 h-10 text-primary mx-auto" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('preview.generating', '미리보기 생성 중...')}</p>
                  {selectedThemeName && <p className="text-xs text-muted-foreground mt-1">{selectedThemeName}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">{t('preview.waiting', 'Select a theme to see preview')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 w-full min-w-0 p-4 space-y-3 border-t border-border bg-background">
        <div className="space-y-2 text-sm w-full min-w-0">
          <div className="block w-full min-w-0 font-medium text-foreground truncate" title={selectedPhoto.file.name}>
            {selectedPhoto.file.name}
          </div>

          {previewInfo && (
            <div className="text-xs text-muted-foreground space-y-1">
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

        <div className="flex w-full min-w-0 items-stretch space-x-2">
          <Button
            variant="primary"
            className={`flex-1 min-w-0 !transition-[background-color,color,border-color] !duration-500 !ease-[cubic-bezier(0.4,0,0.2,1)] ${showDownloadSuccess ? '!bg-emerald-500 !border-emerald-500 !text-white' : ''}`}
            disabled={!themedPreview}
            onClick={handleDownloadClick}
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
            className="h-10 w-10 shrink-0 !bg-destructive/10 !text-destructive !border-destructive/20 hover:!bg-destructive/20 active:!bg-destructive/30 focus:!ring-0 rounded-md transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="relative flex items-center justify-center animate-in zoom-in-95 duration-200" onClick={(event) => event.stopPropagation()}>
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
    </div>
  );
};

export default ImagePreview;
