import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { usePhotoStore } from '../stores/photo-store';
import { useUIStore } from '../stores/ui-store';
import SettingsPanel from './settings-panel';
import PhotoSidebar from './photo-sidebar';
import ImagePreview from './settings/image-preview';
import TopToolbar from './top-toolbar';
import DropZone from './drop-zone';
import PhotoQueueDialog from './photo-queue-dialog';
import Loading from '../pages/convert/components/loading';
import AddPhotoErrorDialog from '../pages/convert/components/add-photo-error.dialog';
import DeleteAllDialog from '../pages/convert/components/delete-all.dialog';
import { usePhotoIntake } from '../hooks/use-photo-intake';
import { isImageFile } from '../utils/image-files';

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const hasDraggedFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

const DesktopLayout = () => {
  const { t } = useTranslation();
  const { photos, removePhoto, clearAllPhotos } = useStore();
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(true);
  const [isPhotoSidebarOpen, setIsPhotoSidebarOpen] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

  const handlePhotosAdded = useCallback((startIndex: number, addedCount: number) => {
    if (addedCount > 0) {
      setSelectedImageIndex(startIndex);
    }
  }, []);
  const { addFiles } = usePhotoIntake({ onManualPhotosAdded: handlePhotosAdded });

  const activeIndex = photos.length === 0 ? null : Math.min(selectedImageIndex ?? 0, photos.length - 1);

  useEffect(() => {
    if (activeIndex !== selectedImageIndex) {
      setSelectedImageIndex(activeIndex);
    }
  }, [activeIndex, selectedImageIndex]);

  const selectRelative = useCallback((offset: number) => {
    const total = usePhotoStore.getState().photos.length;
    if (total === 0) return;
    setSelectedImageIndex((current) => Math.min(total - 1, Math.max(0, (current ?? 0) + offset)));
  }, []);

  const handleDeletePhoto = useCallback(
    (index: number) => {
      const total = usePhotoStore.getState().photos.length;
      if (index < 0 || index >= total) return;
      removePhoto(index);
      setSelectedImageIndex((current) => {
        if (current === null || total <= 1) return null;
        if (current > index) return current - 1;
        return Math.min(current, total - 2);
      });
    },
    [removePhoto],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || isEditableTarget(e.target)) return;
      if (useUIStore.getState().loading || document.querySelector('[aria-modal="true"]')) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        selectRelative(e.key === 'ArrowLeft' ? -1 : 1);
      } else if (e.key === 'Delete' && activeIndex !== null) {
        e.preventDefault();
        handleDeletePhoto(activeIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, handleDeletePhoto, selectRelative]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!hasDraggedFiles(e)) return;
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter(isImageFile);
      if (files.length > 0) {
        void addFiles(files);
      }
    },
    [addFiles],
  );

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center border-4 border-primary border-dashed m-4 pointer-events-none">
          <div className="bg-card p-12 border border-primary shadow-none">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-secondary flex items-center justify-center border border-primary">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary mb-2 uppercase tracking-tight">{t('dropzone.drop-here', 'Drop photos here')}</h3>
                <p className="text-muted-foreground font-mono text-sm">{t('dropzone.drop-description', 'Release to upload')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <TopToolbar
        isPhotoSidebarOpen={isPhotoSidebarOpen}
        setIsPhotoSidebarOpen={setIsPhotoSidebarOpen}
        isSettingsPanelOpen={isSettingsPanelOpen}
        setIsSettingsPanelOpen={setIsSettingsPanelOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {isPhotoSidebarOpen && (
          <aside className="w-64 xl:w-72 border-r border-border flex-shrink-0 z-20 bg-background h-full">
            <PhotoSidebar
              selectedIndex={activeIndex}
              onSelectPhoto={setSelectedImageIndex}
              onDeletePhoto={handleDeletePhoto}
              onClearAll={() => setIsDeleteAllOpen(true)}
              onAddPhotos={addFiles}
            />
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-muted/40 relative">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative flex-1 flex flex-col min-h-0">
            {activeIndex === null ? (
              <DropZone onAddPhotos={addFiles} />
            ) : (
              <ImagePreview
                selectedPhoto={photos[activeIndex]}
                onDelete={() => handleDeletePhoto(activeIndex)}
                onPrevious={() => selectRelative(-1)}
                onNext={() => selectRelative(1)}
              />
            )}
          </div>
        </main>

        {isSettingsPanelOpen && (
          <aside className="w-80 border-l border-border bg-background flex flex-col z-20 h-full flex-shrink-0">
            <SettingsPanel selectedImageIndex={activeIndex} onClose={() => setIsSettingsPanelOpen(false)} />
          </aside>
        )}
      </div>

      <Loading />
      <AddPhotoErrorDialog />
      <PhotoQueueDialog />
      <DeleteAllDialog
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={() => {
          clearAllPhotos();
          setSelectedImageIndex(null);
        }}
      />
    </div>
  );
};

export default DesktopLayout;
