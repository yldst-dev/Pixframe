import React from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';

interface DeleteAllDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAllDialog: React.FC<DeleteAllDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('confirm.delete_all.title', 'Delete All Photos')}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t('confirm.delete_all', 'Are you sure you want to delete all photos? This action cannot be undone.')}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            variant="danger" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteAllDialog;
