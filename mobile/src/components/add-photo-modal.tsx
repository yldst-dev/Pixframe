import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IoImagesOutline, IoFolderOpenOutline } from 'react-icons/io5';
import Button from './ui/button';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoLibrary: () => void;
  onFileBrowser: () => void;
}

const ANIMATION_DURATION = 300;

const AddPhotoModal: React.FC<AddPhotoModalProps> = ({ isOpen, onClose, onPhotoLibrary, onFileBrowser }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleAction = useCallback(
    (action: () => void) => {
      onClose();
      action();
    },
    [onClose],
  );

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ease-out"
        style={{
          transitionDuration: `${ANIMATION_DURATION}ms`,
          opacity: visible ? 1 : 0,
        }}
      />
      <div
        className="relative w-full bg-background rounded-t-2xl px-6 pt-4 pb-6 transition-transform ease-out"
        style={{
          transitionDuration: `${ANIMATION_DURATION}ms`,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-5" />
        <h3 className="text-base font-bold uppercase tracking-tight text-center mb-4">{t('mobile.empty.title', 'Add Photos')}</h3>
        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" onClick={() => handleAction(onPhotoLibrary)} className="w-full">
            <IoImagesOutline size={20} className="mr-2" />
            {t('picker.photo-library', 'Photo Library')}
          </Button>
          <Button variant="outline" size="lg" onClick={() => handleAction(onFileBrowser)} className="w-full">
            <IoFolderOpenOutline size={20} className="mr-2" />
            {t('picker.browse-files', 'Browse Files')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddPhotoModal;
