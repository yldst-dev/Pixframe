import React from 'react';
import { useTranslation } from 'react-i18next';
import { CgMoon, CgSun } from 'react-icons/cg';
import { IoLanguage } from 'react-icons/io5';
import { useStore } from '../store';
import { supportLanguages } from '../locales';
import { SupportedLanguage } from '../types';
import DownloadIcon from '../icons/download.icon';
import GitHubIcon from '../icons/github.icon';
import PfLoader from './ui/pf-loader';
import themes, { useThemeStore } from '../themes';
import Button from './ui/button';
import IconButton from './ui/icon-button';
import SettingsIcon from '../icons/settings.icon';
import ImageIcon from '../icons/image.icon';
import DownloadSettingsModal from './settings/download-settings-modal';
import { createObjectUrl, revokeObjectUrl } from '../core/export/blob';
import { exportPhotosSequentially } from '../core/export/sequential-photo-export';
import { resolveThemeOptions } from '../core/export/theme-options';
import { ZipWriter } from '../core/export/zip';

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
    const { t, i18n } = useTranslation();
    const store = useStore();
    const { photos, selectedThemeName, darkMode, setDarkMode, setLanguage } = store;
    const themeStore = useThemeStore();
    const [showDownloadModal, setShowDownloadModal] = React.useState(false);
    const [downloadProgress, setDownloadProgress] = React.useState({ current: 0, total: 0 });
    const [isDownloadSettingsOpen, setIsDownloadSettingsOpen] = React.useState(false);
    const [isConfirmingDownload, setIsConfirmingDownload] = React.useState(false);

    const canDownloadAll = photos.length > 0 && Boolean(selectedThemeName);
    const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
    const downloadPercent = downloadProgress.total > 0 ? Math.round((downloadProgress.current / downloadProgress.total) * 100) : 0;

    const handleLanguageChange = (language: SupportedLanguage) => {
        void i18n.changeLanguage(language);
        setLanguage(language);
    };

    const handleDownloadAll = async () => {
        if (!selectedThemeName || photos.length === 0) return;
        
        setShowDownloadModal(true);
        setDownloadProgress({ current: 0, total: photos.length });
        
        try {
            const selectedTheme = themes.find(theme => theme.name === selectedThemeName);
            if (!selectedTheme) {
                throw new Error(`Theme "${selectedThemeName}" not found`);
            }

            const themeOptions = resolveThemeOptions(selectedTheme.options, themeStore.option);

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
            
            const themeName = selectedThemeName.replace(/\s+/g, '_').toLowerCase();
            const zipFileName = `exif_frames_${themeName}_${photos.length}photos.zip`;
            
            const link = document.createElement('a');
            link.href = createObjectUrl(zipBlob);
            link.download = zipFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            revokeObjectUrl(link.href);
            
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
            <div className="flex items-center gap-3">
                <IconButton
                  onClick={() => setIsPhotoSidebarOpen(!isPhotoSidebarOpen)}
                  variant={isPhotoSidebarOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  aria-pressed={isPhotoSidebarOpen}
                  tooltip={isPhotoSidebarOpen ? t('toolbar.hide-photos', 'Hide Photos') : t('toolbar.show-photos', 'Show Photos')}
                >
                  <ImageIcon size={18} />
                </IconButton>

                <div className="h-6 w-px bg-border" />

                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="" className="w-7 h-7 dark:invert" />
                    <h1 className="text-lg font-bold tracking-tight uppercase">PixFrame</h1>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <IoLanguage size={16} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                        value={currentLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                        aria-label={t('root.settings.language', 'Language')}
                        title={t('root.settings.language', 'Language')}
                        className="h-8 appearance-none cursor-pointer border border-transparent bg-background pl-8 pr-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {supportLanguages.map((language) => (
                            <option key={language} value={language}>
                                {t(language)}
                            </option>
                        ))}
                    </select>
                </div>

                <IconButton
                    variant="ghost"
                    size="sm"
                    aria-pressed={darkMode}
                    tooltip={t('root.settings.dark-mode', 'Dark Mode')}
                    onClick={() => setDarkMode(!darkMode)}
                >
                    {darkMode ? <CgSun size={18} /> : <CgMoon size={18} />}
                </IconButton>

                <a
                    href="https://github.com/yldst-dev/Pixframe"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t('github.link', 'View on GitHub')}
                    aria-label={t('github.link', 'View on GitHub')}
                    className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <GitHubIcon size={18} />
                </a>

                <div className="h-6 w-px bg-border mx-1" />

                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenDownloadSettings}
                    disabled={!canDownloadAll}
                    className="h-8 uppercase text-xs font-bold tracking-wide"
                >
                    <DownloadIcon size={14} />
                    <span className="ml-2">{t('toolbar.download-all', 'Download All')}</span>
                    {photos.length > 0 && <span className="ml-2 font-mono opacity-60">{photos.length}</span>}
                </Button>

                <div className="h-6 w-px bg-border mx-1" />

                <IconButton
                  onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
                  variant={isSettingsPanelOpen ? 'secondary' : 'ghost'}
                  size="sm"
                  aria-pressed={isSettingsPanelOpen}
                  tooltip={isSettingsPanelOpen ? t('toolbar.hide-settings', 'Hide Settings') : t('toolbar.show-settings', 'Show Settings')}
                >
                  <SettingsIcon size={18} />
                </IconButton>
            </div>

            {showDownloadModal && (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('download.preparing', 'Preparing Download...')}>
                    <div className="bg-card border border-border p-8 max-w-sm w-full shadow-2xl flex flex-col items-center">
                        <PfLoader className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">{t('download.preparing', 'Preparing Download...')}</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                            {downloadProgress.current} / {downloadProgress.total}
                        </p>
                        <div className="mt-4 h-1 w-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${downloadPercent}%` }} />
                        </div>
                    </div>
                </div>
            )}
            <DownloadSettingsModal
                isOpen={isDownloadSettingsOpen}
                onClose={() => setIsDownloadSettingsOpen(false)}
                onConfirm={handleConfirmDownloadAll}
                confirmLabel={t('toolbar.download-all', 'Download All')}
                isConfirmDisabled={!canDownloadAll}
                isConfirmLoading={isConfirmingDownload}
            />
        </header>
    );
};

export default TopToolbar;
