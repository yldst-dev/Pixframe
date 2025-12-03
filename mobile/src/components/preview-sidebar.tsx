import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import ImagePreview from './settings/image-preview';

interface PreviewSidebarProps {
  selectedImageIndex: number | null;
  onClose: () => void;
}

const PreviewSidebar: React.FC<PreviewSidebarProps> = ({ selectedImageIndex, onClose }) => {
  const { t } = useTranslation();
  const { photos, setPreview } = useStore();
  
  // Update preview when selected image changes
  useEffect(() => {
    if (selectedImageIndex !== null && photos[selectedImageIndex]) {
      setPreview(photos[selectedImageIndex]);
    } else {
      setPreview(null);
    }
    
    // Cleanup on unmount
    return () => {
      setPreview(null);
    };
  }, [selectedImageIndex, photos, setPreview]);
  
  const selectedPhoto = selectedImageIndex !== null ? photos[selectedImageIndex] : null;

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('preview.title', '미리보기')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto">
        {selectedPhoto ? (
          <div className="p-4">
            <ImagePreview selectedPhoto={selectedPhoto} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('preview.no-selection', '사진을 선택하면 미리보기가 표시됩니다')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewSidebar;