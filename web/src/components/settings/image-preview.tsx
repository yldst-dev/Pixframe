import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ImageIcon from '../../icons/image.icon';
import Button from '../ui/button';
import IconButton from '../ui/icon-button';
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
import { formatFileSize } from '../../utils/format-file-size';
import { ImagePreviewProps } from '../../types';
import type Photo from '../../core/photo';
import DownloadSettingsModal from './download-settings-modal';
import { IoCheckmarkCircle, IoChevronBack, IoChevronForward, IoClose, IoDownloadOutline } from 'react-icons/io5';

const PREVIEW_CACHE_LIMIT = 24;

const ImagePreview: React.FC<ImagePreviewProps> = ({ selectedPhoto, onDelete, onPrevious, onNext }) => {
  const { t } = useTranslation();
  const store = useStore();
  const {
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
  const [themedPreview, setThemedPreview] = useState<{ src: string; photo: Photo } | null>(null);
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

  useEffect(() => {
    if (!selectedPhoto || !selectedThemeName) {
      setThemedPreview(null);
      setIsGenerating(false);
      setGenerationError(null);
      return;
    }

    const cachedPreview = previewCacheRef.current.get(previewCacheKey);
    if (cachedPreview) {
      setThemedPreview({ src: cachedPreview, photo: selectedPhoto });
      setIsGenerating(false);
      setGenerationError(null);
      return;
    }

    const generationId = generationIdRef.current + 1;
    generationIdRef.current = generationId;
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
          setThemedPreview({ src: previewUrl, photo: selectedPhoto });
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

  if (!selectedPhoto) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 flex items-center justify-center border border-border bg-secondary text-muted-foreground">
            <ImageIcon size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">{t('preview.no-selection', 'No Image Selected')}</h3>
            <p className="text-sm text-muted-foreground">{t('preview.select-description', 'Choose a photo from the sidebar to see the preview')}</p>
          </div>
        </div>
      </div>
    );
  }

  const displayedPreview = themedPreview?.photo === selectedPhoto ? themedPreview.src : null;
  const isPreviewReady = displayedPreview !== null && !isGenerating;
  const photoIndex = photos.indexOf(selectedPhoto);
  const showNavigation = Boolean(onPrevious && onNext) && photos.length > 1;

  return (
    <div className="flex flex-col h-full w-full">
      <div className={`relative flex-1 min-h-0 p-4 lg:py-8 ${showNavigation ? 'lg:px-16' : 'lg:px-8'}`}>
        <div className="image-preview-container">
          <img
            src={displayedPreview ?? selectedPhoto.image.src}
            alt={selectedPhoto.file.name}
            title={displayedPreview ? t('preview.zoom', 'Click to enlarge') : undefined}
            className={`shadow-lg ring-1 ring-border ${displayedPreview ? 'cursor-zoom-in' : ''}`}
            onClick={displayedPreview ? () => setShowModal(true) : undefined}
            decoding="async"
          />
        </div>

        {isGenerating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-foreground/85 text-background text-xs whitespace-nowrap pointer-events-none">
            <span className="h-1.5 w-1.5 bg-background animate-pulse" />
            <span>{t('preview.generating', 'Generating preview...')}</span>
          </div>
        )}

        {generationError && !isGenerating && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className="flex items-center gap-3 max-w-md px-4 py-3 border border-destructive/40 bg-background shadow-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-destructive">{t('preview.generation-error', 'Preview generation failed')}</p>
                <p className="text-xs text-muted-foreground truncate" title={generationError}>
                  {generationError}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setGenerationError(null);
                  setRerenderOptions();
                }}
              >
                {t('preview.retry', 'Try Again')}
              </Button>
            </div>
          </div>
        )}

        {showNavigation && (
          <>
            <IconButton
              variant="outline"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-background"
              disabled={photoIndex <= 0}
              onClick={onPrevious}
              tooltip={`${t('preview.previous', 'Previous photo')} (←)`}
            >
              <IoChevronBack size={18} />
            </IconButton>
            <IconButton
              variant="outline"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-background"
              disabled={photoIndex >= photos.length - 1}
              onClick={onNext}
              tooltip={`${t('preview.next', 'Next photo')} (→)`}
            >
              <IoChevronForward size={18} />
            </IconButton>
          </>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-4 px-4 py-3 border-t border-border bg-background">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium text-foreground truncate" title={selectedPhoto.file.name}>
              {selectedPhoto.file.name}
            </p>
            {photos.length > 1 && photoIndex >= 0 && (
              <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                {photoIndex + 1} / {photos.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-mono text-muted-foreground truncate">
            <span title={t('preview.original-size', 'Original Size')}>
              {selectedPhoto.image.naturalWidth}×{selectedPhoto.image.naturalHeight}
            </span>
            <span className="mx-1.5">·</span>
            <span title={t('preview.file-size', 'File Size')}>{formatFileSize(selectedPhoto.file.size)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onDelete && (
            <IconButton variant="outline" onClick={onDelete} tooltip={t('photo.delete', 'Delete photo')} className="hover:!text-destructive hover:!border-destructive">
              <TrashIcon size={18} />
            </IconButton>
          )}
          <Button
            variant="primary"
            className={`h-10 !transition-[background-color,color,border-color] !duration-500 !ease-[cubic-bezier(0.4,0,0.2,1)] ${showDownloadSuccess ? '!bg-emerald-500 !border-emerald-500 !text-white' : ''}`}
            disabled={!isPreviewReady}
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
                ? t('preview.download-complete', 'Download complete')
                : isPreviewReady
                  ? t('preview.download-single', 'Download this photo')
                  : t('preview.generating', 'Generating preview...')}
            </span>
          </Button>
        </div>
      </div>

      {showModal && displayedPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.file.name}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setShowModal(false)}
        >
          <img src={displayedPreview} alt={selectedPhoto.file.name} className="max-w-full max-h-full object-contain shadow-2xl" />
          <button
            type="button"
            onClick={() => setShowModal(false)}
            aria-label={t('close', 'Close')}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <IoClose size={22} />
          </button>
        </div>
      )}
      <DownloadSettingsModal
        isOpen={showDownloadSettings}
        onClose={() => setShowDownloadSettings(false)}
        onConfirm={handleConfirmDownload}
        confirmLabel={t('preview.download-single', 'Download this photo')}
        isConfirmDisabled={!selectedPhoto || !selectedThemeName}
        isConfirmLoading={isDownloading}
      />
    </div>
  );
};

export default ImagePreview;
