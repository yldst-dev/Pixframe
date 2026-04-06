import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import Button from './ui/button';
import Dialog from './ui/dialog';

const PhotoQueueDialog = () => {
  const { t } = useTranslation();
  const { photoQueueNotice, setPhotoQueueNotice } = useStore();

  return (
    <Dialog isOpen={photoQueueNotice !== null} onClose={() => setPhotoQueueNotice(null)} title={t('queue.notice.title')}>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          {t('queue.notice.body', {
            activeLimit: photoQueueNotice?.activeLimit ?? 0,
            acceptedCount: photoQueueNotice?.acceptedCount ?? 0,
            queuedCount: photoQueueNotice?.queuedCount ?? 0,
          })}
        </p>
        <p>{t('queue.notice.footer', { queueTotal: photoQueueNotice?.queueTotal ?? 0 })}</p>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={() => setPhotoQueueNotice(null)}>
          {t('close')}
        </Button>
      </div>
    </Dialog>
  );
};

export default PhotoQueueDialog;
