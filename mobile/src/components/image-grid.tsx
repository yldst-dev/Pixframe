import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import DownloadIcon from '../icons/download.icon';
import PencilIcon from '../icons/pencil.icon';
import EyeIcon from '../icons/eye.icon';
import IconButton from './ui/icon-button';

interface ImageGridProps {
  selectedIndex: number | null;
  onSelectImage: (index: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ selectedIndex, onSelectImage }) => {
  const { t } = useTranslation();
  const { photos, removePhoto, focalLength35mmMode } = useStore();

  const handleDownloadImage = (_index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Download single image logic
    // Download image at index
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removePhoto(index);
    if (selectedIndex === index) {
      onSelectImage(photos.length > 1 ? Math.max(0, index - 1) : -1);
    }
  };

  const handleEditMetadata = (_index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open metadata editor
    // Edit metadata for image at index
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            onClick={() => onSelectImage(index)}
            className={`
              group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all duration-200 cursor-pointer
              ${selectedIndex === index 
                ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
              }
            `}
          >
            {/* Image Thumbnail */}
            <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
              <img
                src={photo.thumbnail}
                alt={photo.file.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>

            {/* Image Info */}
            <div className="p-3 space-y-2">
              <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate" title={photo.file.name}>
                {photo.file.name}
              </h3>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>
                    {focalLength35mmMode ? photo.metadata.focalLengthIn35mm : photo.metadata.focalLength}
                  </span>
                  <span>{photo.metadata.fNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ISO {photo.metadata.iso}</span>
                  <span>{photo.metadata.exposureTime}</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {photo.metadata.make} {photo.metadata.model}
                </div>
              </div>
            </div>

            {/* Action Buttons - Show on Hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-1">
                <IconButton
                  variant="secondary"
                  size="sm"
                  onClick={(e) => handleEditMetadata(index, e)}
                  tooltip={t('image.edit-metadata', 'Edit Metadata')}
                >
                  <PencilIcon size={14} />
                </IconButton>
                <IconButton
                  variant="secondary"
                  size="sm"
                  onClick={(e) => handleDownloadImage(index, e)}
                  tooltip={t('image.download', 'Download')}
                >
                  <DownloadIcon size={14} />
                </IconButton>
                <IconButton
                  variant="danger"
                  size="sm"
                  onClick={(e) => handleRemoveImage(index, e)}
                  tooltip={t('image.remove', 'Remove')}
                >
                  <span className="text-xs">🗑️</span>
                </IconButton>
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedIndex === index && (
              <div className="absolute top-2 left-2">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-medium">
                  <EyeIcon size={12} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;