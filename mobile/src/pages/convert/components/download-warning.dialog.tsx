import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/button';

interface DownloadWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DownloadWarningDialog: React.FC<DownloadWarningDialogProps> = ({ open, onClose, onConfirm }) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold mb-4 uppercase tracking-tight">
          {t('mobile.download.title', 'Download Notice')}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {t('mobile.download.desc', 'Due to security restrictions on mobile devices, individual image downloads are limited. Your photos will be saved as a ZIP archive.')}
        </p>

        <div className="flex justify-end space-x-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="uppercase text-xs font-bold"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="uppercase text-xs font-bold"
          >
            {t('common.confirm', 'Confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DownloadWarningDialog;
