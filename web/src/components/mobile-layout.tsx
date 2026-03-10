import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import themes, { useThemeStore } from '../themes';
import SettingsPanel from './settings-panel';
import PfLoader from './ui/pf-loader';
import ImagePreview from './settings/image-preview';
import Loading from '../pages/convert/components/loading';
import AddPhotoErrorDialog from '../pages/convert/components/add-photo-error.dialog';
import DownloadWarningDialog from '../pages/convert/components/download-warning.dialog';
import DeleteAllDialog from '../pages/convert/components/delete-all.dialog';
import Photo from '../core/photo';
import Button from './ui/button';
import IconButton from './ui/icon-button';
import AddIcon from '../icons/add.icon';
import SettingsIcon from '../icons/settings.icon';
import DownloadIcon from '../icons/download.icon';
import TrashIcon from '../icons/trash.icon';
import render from '../core/drawing/render';
import JSZip from 'jszip';
import { CgMoon, CgSun } from 'react-icons/cg';

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
    setPhotos,
    setLoading,
    setLoadingProgress,
    setOpenedAddPhotoErrorDialog,
    selectedThemeName,
    setSelectedThemeName,
    themeDarkMode,
    setThemeDarkMode,
    setRerenderOptions,
  } = store;
  const { replaceOptions, option: themeOptionsStore } = useThemeStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const themeDarkModeSupported = THEME_DARK_MODE_SUPPORTED_THEMES.has(selectedThemeName);

  const handleAddPhotos = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setLoading(true);
    setLoadingProgress({ current: 0, total: files.length, currentFileName: files[0]?.name || '' });

    try {
      const newPhotos: Photo[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Use 1-based "current" so the fill is visible even for single-file imports.
        setLoadingProgress({ current: i + 1, total: files.length, currentFileName: file.name });
        try {
          const photo = await Photo.create(file);
          newPhotos.push(photo);
        } catch (e) {
          console.error(e);
        }
      }

      if (newPhotos.length === 0) {
        setOpenedAddPhotoErrorDialog(true);
      } else {
        setPhotos([...photos, ...newPhotos]);
        // Select the first newly added photo
        if (newPhotos.length > 0) {
          setSelectedImageIndex(photos.length);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [photos, setPhotos, setLoading, setLoadingProgress, setOpenedAddPhotoErrorDialog]);

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

  const handleFileInputClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        handleAddPhotos(Array.from(files));
      }
    };
    input.click();
  };

  const handleDownload = async () => {
    if (!selectedThemeName || photos.length === 0) return;
    
    setShowDownloadModal(true);
    setDownloadProgress({ current: 0, total: photos.length });
    
    try {
        const selectedTheme = themes.find(theme => theme.name === selectedThemeName);
        if (!selectedTheme) {
            throw new Error(`Theme "${selectedThemeName}" not found`);
        }

        // Create a Map with all required options and their default values
        const themeOptions = new Map();
        
        // First, set all default values from theme options
        selectedTheme.options.forEach(option => {
            themeOptions.set(option.id, option.default);
        });
        
        // Then override with user-configured values if they exist
        themeOptionsStore.forEach((value, key) => {
            if (selectedTheme.options.some(opt => opt.id === key)) {
                themeOptions.set(key, value);
            }
        });

        // Create a new ZIP file
        const zip = new JSZip();
        
        // Process each photo and add to ZIP
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            
            try {
                // Update progress
                setDownloadProgress({ current: i + 1, total: photos.length });
                
                // Generate themed image
                const canvas = await render(selectedTheme.func, photo, themeOptions, store);
                
                // Convert canvas to blob
                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((blob) => {
                        resolve(blob!);
                    }, 'image/jpeg', store.quality || 0.95);
                });
                
                // Generate filename with theme name
                const fileExtension = photo.file.name.split('.').pop();
                const baseFileName = photo.file.name.replace(/\.[^/.]+$/, "");
                const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();
                const fileName = `${baseFileName}_${themeName}.${store.exportToJpeg ? 'jpg' : fileExtension}`;
                
                // Add the image to ZIP file
                zip.file(fileName, blob);
                
            } catch (error) {
                console.error(`Failed to process photo ${i + 1}:`, error);
            }
        }
        
        // Generate ZIP file and download
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Create download link for ZIP file
        const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();
        const zipFileName = `PixFrame_${themeName}_${photos.length}photos.zip`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = zipFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
        
    } catch (error) {
        console.error('Download failed:', error);
        alert(t('error.download_failed', 'Download failed. Please try again.'));
    } finally {
        setShowDownloadModal(false);
        setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleDeleteOne = useCallback((index?: number) => {
    const targetIndex = index ?? selectedImageIndex;
    if (targetIndex === null) return;
    
    // Remove the photo from the store
    const newPhotos = [...photos];
    newPhotos.splice(targetIndex, 1);
    setPhotos(newPhotos);
    
    // Adjust selected index
    if (newPhotos.length === 0) {
      setSelectedImageIndex(null);
    } else if (selectedImageIndex !== null && selectedImageIndex >= newPhotos.length) {
      setSelectedImageIndex(newPhotos.length - 1);
    }
  }, [photos, selectedImageIndex, setPhotos]);

  // Listen for delete event from ImagePreview
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

  const handleDeleteAll = useCallback(() => {
    if (photos.length === 0) return;
    setShowDeleteAllDialog(true);
  }, [photos.length]);

  const confirmDeleteAll = useCallback(() => {
    setPhotos([]);
    setSelectedImageIndex(null);
  }, [setPhotos]);

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden fixed inset-0">
      {/* Top Toolbar - Simplified for Mobile */}
      <header className="bg-background border-b border-border h-14 flex items-center px-4 justify-between shrink-0 z-30">
         <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="PixFrame" className="w-8 h-8" />
            <h1 className="text-lg font-bold tracking-tight uppercase">PixFrame</h1>
        </div>
        <div className="flex items-center space-x-2">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setShowDownloadWarning(true)}
            disabled={photos.length === 0}
          >
             <DownloadIcon size={20} />
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

      {/* Main Content Area */}
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
             <Button 
               variant="primary" 
               size="lg" 
               onClick={handleFileInputClick}
               className="w-full max-w-xs"
             >
               <AddIcon size={20} className="mr-2" />
               Add Photos
             </Button>
           </div>
        ) : (
           <div className="flex-1 flex flex-col overflow-hidden">
             {/* Image Preview Area */}
             <div className="flex-1 relative bg-muted/10 flex items-center justify-center overflow-hidden">
                {selectedImageIndex !== null && photos[selectedImageIndex] ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePreview selectedPhoto={photos[selectedImageIndex]} />
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Select a photo</div>
                )}
             </div>

              {/* Theme Selector (Bottom Scroll) */}
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
                      setRerenderOptions();
                    }}
                  >
                    {themeDarkMode ? <CgMoon size={18} /> : <CgSun size={18} />}
                  </IconButton>
                </div>
              </div>

             {/* Horizontal Photo List (Bottom Sheet style) */}
             <div className="bg-background border-t border-border shrink-0 overflow-x-auto flex items-center px-4 space-x-3 py-3 min-h-[6rem] max-h-[30vh]">
               <button 
                 onClick={handleFileInputClick}
                 className="w-16 h-16 border border-border border-dashed flex items-center justify-center shrink-0 hover:bg-secondary transition-colors"
               >
                 <div className="flex items-center justify-center w-full h-full">
                   <AddIcon size={24} className="text-muted-foreground" />
                 </div>
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
                 className="w-16 h-16 border border-border border-dashed flex items-center justify-center shrink-0 hover:bg-destructive/10 bg-red-50 transition-colors group"
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

      {/* Settings Sheet (Full screen on mobile) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom-full duration-300">
           <div className="flex items-center justify-between p-4 border-b border-border">
             <h2 className="font-bold uppercase">Settings</h2>
             <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Close</Button>
           </div>
           <div className="flex-1 overflow-y-auto">
             <SettingsPanel 
               selectedImageIndex={selectedImageIndex} 
               onClose={() => setIsSettingsOpen(false)} 
               isMobile={true}
             />
           </div>
        </div>
      )}

      <DownloadWarningDialog 
        open={showDownloadWarning} 
        onClose={() => setShowDownloadWarning(false)} 
        onConfirm={handleDownload} 
      />

      {/* Download Progress Modal */}
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
      
      {/* Delete All Dialog */}
      <DeleteAllDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={confirmDeleteAll}
      />
    </div>
  );
};

export default MobileLayout;
