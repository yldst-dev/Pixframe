import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import SettingsPanel from './settings-panel';
import PhotoSidebar from './photo-sidebar';
import ImagePreview from './settings/image-preview';
import TopToolbar from './top-toolbar';
import DropZone from './drop-zone';
import Loading from '../pages/convert/components/loading';
import AddPhotoErrorDialog from '../pages/convert/components/add-photo-error.dialog';
import Photo from '../core/photo';

const DesktopLayout = () => {
  const { t } = useTranslation();
  const { photos, setPhotos, setLoading, setOpenedAddPhotoErrorDialog } = useStore();
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(true);
  const [isPhotoSidebarOpen, setIsPhotoSidebarOpen] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddPhotos = useCallback(async (files: File[]) => {
    setLoading(true);
    try {
      const newPhotos = await Promise.all(files.map(Photo.create));
      setPhotos([...photos, ...newPhotos]);
    } catch (e) {
      console.error(e);
      setOpenedAddPhotoErrorDialog(true);
    }
    setLoading(false);
  }, [photos, setPhotos, setLoading, setOpenedAddPhotoErrorDialog]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only hide drag overlay if leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => {
      // Check for standard image types
      if (file.type.startsWith('image/')) return true;
      
      // Check for HEIC/HEIF files by extension (since browsers may not recognize the MIME type)
      const fileName = file.name.toLowerCase();
      return fileName.endsWith('.heic') || fileName.endsWith('.heif');
    });
    
    if (files.length > 0) {
      handleAddPhotos(files);
    }
  }, [handleAddPhotos]);

  return (
    <div 
      className="h-screen flex flex-col bg-background relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center border-4 border-primary border-dashed m-4">
          <div className="bg-card p-12 border border-primary shadow-none">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-secondary flex items-center justify-center border border-primary">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary mb-2 uppercase tracking-tight">
                  {t('dropzone.drop-here', 'DROP PHOTOS HERE')}
                </h3>
                <p className="text-muted-foreground font-mono text-sm">
                  {t('dropzone.drop-description', 'Release to upload')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <TopToolbar 
        isPhotoSidebarOpen={isPhotoSidebarOpen}
        setIsPhotoSidebarOpen={setIsPhotoSidebarOpen}
        isSettingsPanelOpen={isSettingsPanelOpen}
        setIsSettingsPanelOpen={setIsSettingsPanelOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Photo Sidebar */}
        {isPhotoSidebarOpen && (
          <div className="border-r border-border flex-shrink-0 z-20 bg-background h-full">
            <PhotoSidebar 
              selectedIndex={selectedImageIndex}
              onSelectPhoto={(index) => setSelectedImageIndex(index === -1 ? null : index)}
              onClose={() => setIsPhotoSidebarOpen(false)}
            />
          </div>
        )}
        
        {/* Center Panel - Preview Main Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-muted/30 relative">
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>

          {photos.length === 0 ? (
            <DropZone />
          ) : selectedImageIndex !== null ? (
            <ImagePreview selectedPhoto={photos[selectedImageIndex]} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6 max-w-md p-8 border border-border bg-card">
                <div className="w-24 h-24 mx-auto bg-secondary flex items-center justify-center border border-border">
                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2 uppercase">
                    {t('preview.select-image', 'Select a Photo')}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t('preview.select-description', 'Choose a photo from the sidebar to see the preview')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Settings */}
        {isSettingsPanelOpen && (
          <div className="w-80 border-l border-border bg-background flex flex-col z-20 h-full shadow-[-1px_0_0_0_var(--border)]">
            <SettingsPanel 
              selectedImageIndex={selectedImageIndex}
              onClose={() => setIsSettingsPanelOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Loading and Error Components */}
      <Loading />
      <AddPhotoErrorDialog />
    </div>
  );
};

export default DesktopLayout;
