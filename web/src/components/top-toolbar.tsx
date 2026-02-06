import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import DownloadIcon from '../icons/download.icon';
import GitHubIcon from '../icons/github.icon';
import themes, { useThemeStore } from '../themes';
import render from '../core/drawing/render';
import Button from './ui/button';
import IconButton from './ui/icon-button';
import JSZip from 'jszip';
import SettingsIcon from '../icons/settings.icon';
import ImageIcon from '../icons/image.icon';
import DownloadSettingsModal from './settings/download-settings-modal';
import { getExportFormat } from '../utils/export-format';

interface TopToolbarProps {
  isPhotoSidebarOpen: boolean;
  setIsPhotoSidebarOpen: (isOpen: boolean) => void;
  isSettingsPanelOpen: boolean;
  setIsSettingsPanelOpen: (isOpen: boolean) => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  isPhotoSidebarOpen,
  setIsPhotoSidebarOpen,
  isSettingsPanelOpen,
  setIsSettingsPanelOpen
}) => {
    const { t } = useTranslation();
    const store = useStore();
    const { photos, selectedThemeName } = store;
    const themeStore = useThemeStore();
    const [showDownloadModal, setShowDownloadModal] = React.useState(false);
    const [downloadProgress, setDownloadProgress] = React.useState({ current: 0, total: 0 });
    const [isDownloadSettingsOpen, setIsDownloadSettingsOpen] = React.useState(false);
    const [isConfirmingDownload, setIsConfirmingDownload] = React.useState(false);

    const canDownloadAll = photos.length > 0 && Boolean(selectedThemeName);

    const handleDownloadAll = async () => {
        if (!selectedThemeName || photos.length === 0) return;
        
        setShowDownloadModal(true);
        setDownloadProgress({ current: 0, total: photos.length });
        
        try {
            const selectedTheme = themes.find(theme => theme.name === selectedThemeName);
            if (!selectedTheme) {
                throw new Error(`Theme "${selectedThemeName}" not found`);
            }

            const themeOptions = new Map();
            
            selectedTheme.options.forEach(option => {
                themeOptions.set(option.id, option.default);
            });
            
            themeStore.option.forEach((value, key) => {
                if (selectedTheme.options.some(opt => opt.id === key)) {
                    themeOptions.set(key, value);
                }
            });

            const zip = new JSZip();
            
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                
                try {
                    setDownloadProgress({ current: i + 1, total: photos.length });
                    
                    const canvas = await render(selectedTheme.func, photo, themeOptions, store);
                    
                    const { mimeType, extension, useJpeg } = getExportFormat(photo.file.name, store.exportToJpeg);
                    const quality = useJpeg ? store.quality || 0.95 : undefined;
                    const blob = await new Promise<Blob>((resolve) => {
                        canvas.toBlob((blob) => {
                            resolve(blob!);
                        }, mimeType, quality);
                    });
                    
                    const baseFileName = photo.file.name.replace(/\.[^/.]+$/, "");
                    const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();
                    const fileName = `${baseFileName}_${themeName}.${extension}`;
                    
                    zip.file(fileName, blob);
                    
                } catch (error) {
                    console.error(`Failed to process photo ${i + 1}:`, error);
                }
            }
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();
            const zipFileName = `exif_frames_${themeName}_${photos.length}photos.zip`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = zipFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(link.href);
            
        } catch (error) {
            console.error('Download failed:', error);
            alert(t('error.download_failed', 'Download failed. Please try again.'));
        } finally {
            setShowDownloadModal(false);
            setDownloadProgress({ current: 0, total: 0 });
        }
    };

    const handleOpenDownloadSettings = () => {
        if (!canDownloadAll) return;
        setIsDownloadSettingsOpen(true);
    };

    const handleConfirmDownloadAll = async () => {
        if (!canDownloadAll || isConfirmingDownload) return;
        setIsConfirmingDownload(true);
        setIsDownloadSettingsOpen(false);
        await handleDownloadAll();
        setIsConfirmingDownload(false);
    };

    return (
        <header className="bg-background border-b border-border h-14 flex items-center px-4 justify-between shrink-0 z-30 relative">
            <div className="flex items-center space-x-4">
                <IconButton 
                  onClick={() => setIsPhotoSidebarOpen(!isPhotoSidebarOpen)}
                  variant={isPhotoSidebarOpen ? 'primary' : 'outline'}
                  size="sm"
                  tooltip={t('toolbar.toggle_sidebar', 'Toggle Sidebar')}
                >
                  <ImageIcon size={18} />
                </IconButton>

                <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="PixFrame" className="w-8 h-8" />
                    <h1 className="text-xl font-bold tracking-tight uppercase">PixFrame</h1>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">BETA</span>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <IconButton
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://github.com/yldst-dev/Pixframe', '_blank')}
                >
                    <GitHubIcon size={18} />
                </IconButton>

                <div className="h-6 w-px bg-border mx-2" />

                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenDownloadSettings}
                    disabled={!canDownloadAll}
                    className="uppercase text-xs font-bold tracking-wide"
                >
                    <span className="mr-2"><DownloadIcon size={14} /></span>
                    {t('toolbar.download_all', 'Download All')}
                </Button>

                <div className="h-6 w-px bg-border mx-2" />

                <IconButton 
                  onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
                  variant={isSettingsPanelOpen ? 'primary' : 'outline'}
                  size="sm"
                  tooltip={t('toolbar.toggle_settings', 'Toggle Settings')}
                >
                  <SettingsIcon size={18} />
                </IconButton>
            </div>

            {showDownloadModal && (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-card border border-border p-8 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">{t('download.preparing', 'Preparing Download...')}</h3>
                        <div className="w-full bg-secondary h-2 mb-4 overflow-hidden">
                            <div 
                                className="bg-primary h-full transition-all duration-300 ease-out"
                                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground font-mono text-right">
                            {downloadProgress.current} / {downloadProgress.total}
                        </p>
                    </div>
                </div>
            )}
            <DownloadSettingsModal
                isOpen={isDownloadSettingsOpen}
                onClose={() => setIsDownloadSettingsOpen(false)}
                onConfirm={handleConfirmDownloadAll}
                confirmLabel={t('toolbar.download_all', 'Download All')}
                isConfirmDisabled={!canDownloadAll}
                isConfirmLoading={isConfirmingDownload}
            />
        </header>
    );
};

export default TopToolbar;
