import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageIcon from '../icons/image.icon';
import AddIcon from '../icons/add.icon';
import Button from './ui/button';

interface DropZoneProps {
  onAddPhotos: (files: File[] | FileList) => Promise<void>;
}

const DropZone: React.FC<DropZoneProps> = ({ onAddPhotos }) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      void onAddPhotos(files);
    }
  }, [onAddPhotos]);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        void onAddPhotos(files);
      }
    };
    input.click();
  }, [onAddPhotos]);

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full max-w-2xl h-96 border-2 border-dashed rounded-xl
          flex flex-col items-center justify-center space-y-6
          transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-500' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
        `}
        onClick={handleFileSelect}
      >
        <div className={`
          transition-colors
          ${isDragOver
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500'
          }
        `}>
          <ImageIcon size={48} />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isDragOver 
              ? t('dropzone.drop-here', 'Drop your images here')
              : t('dropzone.title', 'Add your photos')
            }
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            {isDragOver 
              ? t('dropzone.drop-description', 'Release to upload your images')
              : t('dropzone.description', 'Drag and drop your images here, or click to browse')
            }
          </p>
        </div>

        <Button
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelect();
          }}
        >
          <AddIcon size={16} />
          <span className="ml-2">{t('dropzone.browse', 'Browse Files')}</span>
        </Button>

        <div className="text-xs text-gray-400 dark:text-gray-500">
          {t('dropzone.formats', 'Supports: JPG, PNG, HEIC, and more')}
        </div>
      </div>
    </div>
  );
};

export default DropZone;
