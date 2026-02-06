import React from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '../ui/dialog';
import Button from '../ui/button';
import ExportSettings from './export-settings';

interface DownloadSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  title?: string;
  isConfirmDisabled?: boolean;
  isConfirmLoading?: boolean;
}

const DownloadSettingsModal: React.FC<DownloadSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  confirmLabel,
  title,
  isConfirmDisabled = false,
  isConfirmLoading = false
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('download.settings.title', 'Download Settings')}
      className="max-w-3xl w-full max-h-[calc(100dvh-2rem)] flex flex-col"
      bodyClassName="p-0 flex flex-col min-h-0"
    >
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hidden px-6 py-4">
        <ExportSettings />
      </div>
      <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-border bg-background">
        <Button variant="secondary" onClick={onClose}>
          {t('close', 'Close')}
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isConfirmDisabled || isConfirmLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
};

export default DownloadSettingsModal;
