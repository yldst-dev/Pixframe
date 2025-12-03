import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import AddIcon from '../icons/add.icon';
import Photo from '../core/photo';
import Button from './ui/button';

interface PhotoSidebarProps {
  selectedIndex: number | null;
  onSelectPhoto: (index: number) => void;
  onClose: () => void;
}

const PhotoSidebar: React.FC<PhotoSidebarProps> = ({ selectedIndex, onSelectPhoto }) => {
  const { t } = useTranslation();
  const { photos, setPhotos, setLoading, setOpenedAddPhotoErrorDialog, clearAllPhotos } = useStore();

  const handleAddPhotos = async (files: FileList) => {
    setLoading(true);
    try {
      const newPhotos = await Promise.all(Array.from(files).map(Photo.create));
      setPhotos([...photos, ...newPhotos]);
    } catch (e) {
      console.error(e);
      setOpenedAddPhotoErrorDialog(true);
    }
    setLoading(false);
  };

  const handleDeletePhoto = (e: React.MouseEvent, indexToDelete: number) => {
    e.stopPropagation(); 
    
    const updatedPhotos = photos.filter((_, index) => index !== indexToDelete);
    setPhotos(updatedPhotos);
    
    if (selectedIndex === indexToDelete) {
      onSelectPhoto(-1);
    } else if (selectedIndex !== null && selectedIndex > indexToDelete) {
      onSelectPhoto(selectedIndex - 1);
    }
  };

  const handleFileInputClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        handleAddPhotos(files);
      }
    };
    input.click();
  };

  return (
    <div className="w-80 h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-bold uppercase tracking-tight text-foreground">
          {photos.length === 0 
            ? t('workspace.empty.title', 'WORKSPACE') 
            : `${photos.length} PHOTOS`
          }
        </h3>
        {photos.length > 0 && (
           <button 
             onClick={clearAllPhotos}
             className="text-xs text-muted-foreground hover:text-destructive uppercase font-medium"
           >
             Clear All
           </button>
        )}
      </div>

      {/* Add Photos Button */}
      <div className="p-4 border-b border-border shrink-0">
        <Button
          variant="primary"
          className="w-full uppercase text-xs font-bold tracking-wide"
          onClick={handleFileInputClick}
        >
          <AddIcon size={16} />
          <span className="ml-2">{t('toolbar.add-photos', 'ADD PHOTOS')}</span>
        </Button>
      </div>

      {/* Photos List */}
      <div className="flex-1 overflow-y-auto">
        {photos.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8 opacity-50">
            <div className="text-center">
               <p className="text-sm font-mono text-muted-foreground">No photos added</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {photos.map((photo, index) => (
              <div
                key={index}
                onClick={() => onSelectPhoto(index)}
                className={`
                  group relative flex items-center p-3 cursor-pointer transition-colors
                  ${selectedIndex === index 
                    ? 'bg-secondary' 
                    : 'hover:bg-muted/50'
                  }
                `}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-muted flex-shrink-0 overflow-hidden border border-border relative">
                  <img 
                    src={photo.thumbnail} 
                    alt={photo.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {photo.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {Math.round(photo.file.size / 1024)} KB
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeletePhoto(e, index)}
                  className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title={t('common.delete', 'Delete')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Active Indicator */}
                {selectedIndex === index && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoSidebar;
