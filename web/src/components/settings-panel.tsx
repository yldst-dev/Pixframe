import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import ThemeSettings from './settings/theme-settings';
import IconButton from './ui/icon-button';

interface SettingsPanelProps {
  selectedImageIndex: number | null;
  onClose: () => void;
  isMobile?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ selectedImageIndex, onClose, isMobile = false }) => {
  const { t } = useTranslation();
  const { photos } = useStore();

  const selectedPhoto = selectedImageIndex !== null ? photos[selectedImageIndex] : null;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="font-bold uppercase tracking-tight text-foreground">
          {t('settings.title', 'SETTINGS')}
        </h2>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <ThemeSettings selectedPhoto={selectedPhoto} isMobile={isMobile} />
      </div>
    </div>
  );
};

export default SettingsPanel;
