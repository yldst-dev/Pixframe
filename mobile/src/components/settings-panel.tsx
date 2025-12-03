import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import SettingsIcon from '../icons/settings.icon';
import ImageIcon from '../icons/image.icon';
import ThemeSettings from './settings/theme-settings';
import ExportSettings from './settings/export-settings';
import IconButton from './ui/icon-button';

interface SettingsPanelProps {
  selectedImageIndex: number | null;
  onClose: () => void;
  isMobile?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ selectedImageIndex, onClose, isMobile = false }) => {
  const { t } = useTranslation();
  const { photos } = useStore();
  const [activeSection, setActiveSection] = useState<'theme' | 'export'>('theme');

  const selectedPhoto = selectedImageIndex !== null ? photos[selectedImageIndex] : null;

  const sections = [
    {
      id: 'theme' as const,
      title: t('settings.theme', 'Theme'),
      icon: ImageIcon,
      description: t('settings.theme.description', 'Frame style and appearance')
    },
    {
      id: 'export' as const,
      title: t('settings.export', 'Export'),
      icon: SettingsIcon,
      description: t('settings.export.description', 'Output format and quality')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Header */}
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

      {/* Tabs */}
      <div className="flex border-b border-border">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors
                ${isActive 
                  ? 'bg-secondary text-foreground border-b-2 border-primary' 
                  : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <Icon size={16} />
                <span className="font-bold uppercase text-xs tracking-wide">{section.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'theme' && (
          <ThemeSettings selectedPhoto={selectedPhoto} isMobile={isMobile} />
        )}
        {activeSection === 'export' && (
          <ExportSettings />
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
