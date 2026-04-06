import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import themes, { useThemeStore } from '../themes';
import SettingsPanel from './settings-panel';
import PfLoader from './ui/pf-loader';
import ImagePreview from './settings/image-preview';
import PhotoQueueDialog from './photo-queue-dialog';
import Loading from '../pages/convert/components/loading';
import AddPhotoErrorDialog from '../pages/convert/components/add-photo-error.dialog';
import DownloadWarningDialog from '../pages/convert/components/download-warning.dialog';
import DeleteAllDialog from '../pages/convert/components/delete-all.dialog';
import Button from './ui/button';
import IconButton from './ui/icon-button';
import AddIcon from '../icons/add.icon';
import SettingsIcon from '../icons/settings.icon';
import TrashIcon from '../icons/trash.icon';
import { CgMoon, CgSun } from 'react-icons/cg';
import { IoCheckmarkCircle, IoDownloadOutline, IoImagesOutline, IoFolderOpenOutline } from 'react-icons/io5';
import { Capacitor } from '@capacitor/core';
import downloadFile from '../core/file-system/download';
import { showToast } from '../core/toast';
import { openPhotoLibrary, openFileBrowser } from '../utils/image-file-picker';
import AddPhotoModal from './add-photo-modal';
import { usePhotoIntake } from '../hooks/use-photo-intake';
import { exportPhotosSequentially } from '../core/export/sequential-photo-export';
import { resolveThemeOptions } from '../core/export/theme-options';
import { ZipWriter } from '../core/export/zip';

const THEME_DARK_MODE_SUPPORTED_THEMES = new Set<string>([
  'Just frame',
  'Simple',
  'Strap',
  'One line',
  'Two line',
  'Shot on one line',
  'Shot on two line',
  'Monitor',
]);

const MobileLayout = () => {
  const { t } = useTranslation();
  const store = useStore();
  const {
    photos,
    queuedFiles,
    setPhotos,
    clearAllPhotos,
    setOpenedAddPhotoErrorDialog,
    selectedThemeName,
    setSelectedThemeName,
    themeDarkMode,
    setThemeDarkMode,
  } = store;
  const { replaceOptions, option: themeOptionsStore } = useThemeStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const downloadSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addFiles } = usePhotoIntake({
    onManualPhotosAdded: (startIndex, addedCount) => {
      if (addedCount > 0) {
        setSelectedImageIndex(startIndex);
      }
    },
  });

  const themeDarkModeSupported = THEME_DARK_MODE_SUPPORTED_THEMES.has(selectedThemeName);

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

  const handleThemeSelect = useCallback((themeName: string) => {
    setSelectedThemeName(themeName);
    
    const newTheme = themes.find(theme => theme.name === themeName);
    const prevTheme = themes.find(theme => theme.name === selectedThemeName);
    
    if (newTheme) {
      const prevOptionIds = prevTheme?.options.map(option => option.id) || [];
      const newThemeOptions = new Map();
      newTheme.options.forEach(option => {
        newThemeOptions.set(option.id, option.default);
      });
      replaceOptions(prevOptionIds, newThemeOptions);
    }
  }, [selectedThemeName, setSelectedThemeName, replaceOptions]);

  const handlePhotoLibraryClick = () => {
    void openPhotoLibrary()
      .then((files) => {
        if (files.length > 0) {
          void addFiles(files);
        }
      })
      .catch((error) => {
        console.error(error);
        setOpenedAddPhotoErrorDialog(true);
      });
  };

  const handleFileBrowserClick = () => {
    void openFileBrowser()
      .then((files) => {
        if (files.length > 0) {
          void addFiles(files);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleDownload = async () => {
    if (!selectedThemeName || photos.length === 0) return;

    setShowDownloadModal(true);
    setDownloadProgress({ current: 0, total: photos.length });

    try {
      const selectedTheme = themes.find((theme) => theme.name === selectedThemeName);
      if (!selectedTheme) {
        throw new Error(`Theme "${selectedThemeName}" not found`);
      }

      const themeOptions = resolveThemeOptions(selectedTheme.options, themeOptionsStore);

      const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();

      if (Capacitor.isNativePlatform()) {
        const failed: string[] = [];
        for await (const file of exportPhotosSequentially({
          onProgress: (progress) => {
            setDownloadProgress({ current: progress.current, total: progress.total });
          },
          photos,
          store,
          themeFunc: selectedTheme.func,
          themeName: selectedThemeName,
          themeOptions,
        })) {
          try {
            await downloadFile(file.filename, file.blob);
          } catch (error) {
            failed.push(file.filename);
            console.error(`Failed to save file: ${file.filename}`, error);
          }
        }

        if (failed.length > 0) {
          throw new Error(`Failed to save ${failed.length} file(s)`);
        }
        triggerDownloadSuccess();
        showToast(t('root.successfully-downloaded-in-gallery'));
        return;
      }

      const zip = new ZipWriter();
      for await (const file of exportPhotosSequentially({
        onProgress: (progress) => {
          setDownloadProgress({ current: progress.current, total: progress.total });
        },
        photos,
        store,
        themeFunc: selectedTheme.func,
        themeName: selectedThemeName,
        themeOptions,
      })) {
        zip.addFile(file);
      }
      const zipBlob = await zip.finalize();
      const zipFileName = `PixFrame_${themeName}_${photos.length}photos.zip`;
      await downloadFile(zipFileName, zipBlob);
      triggerDownloadSuccess();
    } catch (error) {
      console.error('Download failed:', error);
      showToast({
        message: t('error.download_failed', 'Download failed. Please try again.'),
        variant: 'error',
      });
    } finally {
      setShowDownloadModal(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleDeleteOne = useCallback((index?: number) => {
    const targetIndex = index ?? selectedImageIndex;
    if (targetIndex === null) return;

    const newPhotos = [...photos];
    newPhotos.splice(targetIndex, 1);
    setPhotos(newPhotos);

    if (newPhotos.length === 0) {
      setSelectedImageIndex(null);
    } else if (selectedImageIndex !== null && selectedImageIndex >= newPhotos.length) {
      setSelectedImageIndex(newPhotos.length - 1);
    }
  }, [photos, selectedImageIndex, setPhotos]);

  useEffect(() => {
    const handleDeleteEvent = (event: Event) => {
      const e = event as CustomEvent<{ index: number }>;
      handleDeleteOne(e.detail.index);
    };

    window.addEventListener('delete-current-photo', handleDeleteEvent);
    return () => {
      window.removeEventListener('delete-current-photo', handleDeleteEvent);
    };
  }, [handleDeleteOne]);

  useEffect(() => {
    return () => {
      if (downloadSuccessTimerRef.current) {
        clearTimeout(downloadSuccessTimerRef.current);
      }
    };
  }, []);

  const handleDeleteAll = useCallback(() => {
    if (photos.length === 0) return;
    setShowDeleteAllDialog(true);
  }, [photos.length]);

  const confirmDeleteAll = useCallback(() => {
    clearAllPhotos();
    setSelectedImageIndex(null);
  }, [clearAllPhotos]);

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden fixed inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="bg-background border-b border-border h-14 flex items-center px-4 justify-between shrink-0 z-30">
         <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="PixFrame" className="w-8 h-8" />
            <h1 className="text-lg font-bold tracking-tight uppercase">PixFrame</h1>
        </div>
        <div className="flex items-center space-x-2">
          {queuedFiles.length > 0 && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              {t('queue.badge', { count: queuedFiles.length })}
            </span>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (Capacitor.isNativePlatform()) {
                void handleDownload();
                return;
              }
              setShowDownloadWarning(true);
            }}
            disabled={photos.length === 0}
            className={showDownloadSuccess ? 'animate-[pf-success-bg_2s_ease-out]' : ''}
          >
            <span className="relative block w-5 h-5">
              <IoDownloadOutline
                className={`absolute inset-0 h-5 w-5 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${showDownloadSuccess ? 'scale-50 opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0'}`}
              />
              <IoCheckmarkCircle
                key={showDownloadSuccess ? 'success' : 'idle'}
                className={`absolute inset-0 h-5 w-5 text-emerald-500 transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDownloadSuccess ? 'opacity-100 blur-0 animate-[pf-success-pop_600ms_ease-out]' : 'scale-75 opacity-0 blur-[2px]'}`}
              />
            </span>
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            disabled={photos.length === 0}
          >
             <SettingsIcon size={20} />
          </IconButton>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-w-0 bg-muted/30 relative overflow-hidden">
        {photos.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
             <div className="w-20 h-20 bg-secondary flex items-center justify-center border border-border rounded-none">
                <AddIcon size={32} className="text-muted-foreground" />
             </div>
             <div>
               <h3 className="text-lg font-bold uppercase mb-2">{t('mobile.empty.title', 'Add Photos')}</h3>
               <p className="text-sm text-muted-foreground">{t('mobile.empty.desc', 'Tap button below to start')}</p>
             </div>
             <div className="flex flex-col gap-3 w-full max-w-xs">
               <Button 
                 variant="primary" 
                 size="lg" 
                 onClick={handlePhotoLibraryClick}
                 className="w-full"
               >
                 <IoImagesOutline size={20} className="mr-2" />
                 {t('picker.photo-library', 'Photo Library')}
               </Button>
               <Button 
                 variant="outline" 
                 size="lg" 
                 onClick={handleFileBrowserClick}
                 className="w-full"
               >
                 <IoFolderOpenOutline size={20} className="mr-2" />
                 {t('picker.browse-files', 'Browse Files')}
               </Button>
             </div>
           </div>
        ) : (
           <div className="flex-1 flex flex-col overflow-hidden">
             <div className="flex-1 relative bg-muted/10 flex items-center justify-center overflow-hidden">
                {selectedImageIndex !== null && photos[selectedImageIndex] ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePreview selectedPhoto={photos[selectedImageIndex]} />
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Select a photo</div>
                )}
             </div>

              <div className="h-12 bg-background border-t border-border shrink-0 flex items-center px-2">
                <div className="flex-1 overflow-x-auto flex items-center space-x-2 no-scrollbar">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => handleThemeSelect(theme.name)}
                      className={`
                        px-3 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border
                        ${selectedThemeName === theme.name 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                        }
                      `}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>

                <div className="shrink-0 ml-2">
                  <IconButton
                    variant={themeDarkMode ? 'primary' : 'outline'}
                    size="sm"
                    tooltip={t('root.settings.theme-dark-mode', 'Theme Dark Mode')}
                    aria-label={t('root.settings.theme-dark-mode', 'Theme Dark Mode')}
                    disabled={!themeDarkModeSupported}
                    onClick={() => {
                      if (!themeDarkModeSupported) return;
                      setThemeDarkMode(!themeDarkMode);
                    }}
                  >
                    <span className="relative block h-[18px] w-[18px]">
                      <CgSun
                        size={18}
                        className={`absolute inset-0 transition-[opacity,transform] duration-200 ease-out ${themeDarkMode ? 'opacity-0 scale-90 -translate-y-0.5' : 'opacity-100 scale-100 translate-y-0'}`}
                      />
                      <CgMoon
                        size={18}
                        className={`absolute inset-0 transition-[opacity,transform] duration-200 ease-out ${themeDarkMode ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-0.5'}`}
                      />
                    </span>
                  </IconButton>
                </div>
              </div>

             <div className="bg-background border-t border-border shrink-0 overflow-x-auto flex items-center px-4 space-x-3 py-3 min-h-[6rem] max-h-[30vh]">
               <button 
                  onClick={() => setShowAddPhotoModal(true)}
                  className="w-16 h-16 border border-border border-dashed flex items-center justify-center shrink-0 hover:bg-secondary transition-colors"
                  title={t('root.add-photo', 'Add Photo')}
                >
                  <AddIcon size={24} className="text-muted-foreground" />
                </button>
               
               {photos.map((photo, index) => (
                 <button
                   key={index}
                   onClick={() => setSelectedImageIndex(index)}
                   className={`
                     w-16 h-16 border shrink-0 relative overflow-hidden transition-all
                     ${selectedImageIndex === index ? 'border-primary ring-1 ring-primary' : 'border-border'}
                   `}
                 >
                   <img src={photo.thumbnail} className="w-full h-full object-cover" alt="" />
                 </button>
               ))}

               <button 
                 onClick={handleDeleteAll}
                 className="w-16 h-16 border border-border border-dashed flex items-center justify-center shrink-0 hover:bg-destructive/20 bg-destructive/10 transition-colors group"
                 title={t('delete.all', 'Delete All')}
               >
                 <div className="flex items-center justify-center w-full h-full text-destructive transition-colors">
                   <TrashIcon size={24} />
                 </div>
               </button>
             </div>
           </div>
        )}
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom-full duration-300 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
           <SettingsPanel 
             selectedImageIndex={selectedImageIndex} 
             onClose={() => setIsSettingsOpen(false)} 
             isMobile={true}
           />
        </div>
      )}

      <DownloadWarningDialog 
        open={showDownloadWarning} 
        onClose={() => setShowDownloadWarning(false)} 
        onConfirm={handleDownload} 
      />

      {showDownloadModal && (
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-card border border-border p-8 max-w-sm w-full shadow-2xl flex flex-col items-center">
                  <PfLoader className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">{t('download.preparing', 'Preparing Download...')}</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                      {downloadProgress.current} / {downloadProgress.total}
                  </p>
              </div>
          </div>
      )}

      <Loading />
      <AddPhotoErrorDialog />
      <PhotoQueueDialog />
      
      <DeleteAllDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={confirmDeleteAll}
      />

      <AddPhotoModal
        isOpen={showAddPhotoModal}
        onClose={() => setShowAddPhotoModal(false)}
        onPhotoLibrary={handlePhotoLibraryClick}
        onFileBrowser={handleFileBrowserClick}
      />
    </div>
  );
};

export default MobileLayout;
