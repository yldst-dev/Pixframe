import { ChangeEvent, useCallback, useState } from 'react';
import Photo from '../../../core/photo';
import { useStore } from '../../../store';
import DragInDropIcon from '../../../icons/drag-in-drop.icon';
import { t } from 'i18next';

// Supported image MIME types
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const AddPhotoDragInDrop = () => {
  const { photos, setPhotos, setLoading, setOpenedAddPhotoErrorDialog, darkMode } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList) => {
    setError(null);
    setLoading(true);
    
    try {
      const validFiles = Array.from(files).filter(file => 
        SUPPORTED_TYPES.some(type => file.type.includes(type.split('/')[1] || ''))
      );

      if (validFiles.length === 0) {
        throw new Error('No supported image files found. Please upload JPEG, PNG, or WebP files.');
      }

      const newPhotos = await Promise.all(
        validFiles.map(file => Photo.create(file).catch(e => {
          console.error(`Error processing ${file.name}:`, e);
          return null;
        }))
      );

      const successfulPhotos = newPhotos.filter((photo): photo is Photo => photo !== null);
      
      if (successfulPhotos.length > 0) {
        setPhotos([...photos, ...successfulPhotos]);
      }
      
      if (successfulPhotos.length < validFiles.length) {
        setError(`Could not process ${validFiles.length - successfulPhotos.length} file(s).`);
      }
    } catch (e) {
      console.error('Error processing files:', e);
      setError(e instanceof Error ? e.message : 'An error occurred while processing the files.');
      setOpenedAddPhotoErrorDialog(true);
    } finally {
      setLoading(false);
    }
  }, [photos, setLoading, setOpenedAddPhotoErrorDialog, setPhotos]);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const { files } = e.dataTransfer;
    if (!files || files.length === 0) return;
    
    await processFiles(files);
  };

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;
    
    await processFiles(files);
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <div style={{ margin: '32px' }}>
      <input 
        type="file" 
        accept={SUPPORTED_TYPES.join(',')} 
        onChange={onChange} 
        onClick={(e) => (e.currentTarget.value = '')} 
        multiple 
        hidden 
        id="file-upload"
      />

      <div
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '20rem',
          border: `2px dashed ${isDragging ? '#3b82f6' : (darkMode ? '#4b5563' : '#9ca3af')}`,
          borderRadius: '0.5rem',
          backgroundColor: isDragging ? (darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.5)') : 'transparent',
          transition: 'all 0.2s ease-in-out',
          padding: '1rem',
        }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
        role="button"
        aria-label="Upload photos"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('file-upload')?.click();
          }
        }}
      >
        <DragInDropIcon size={48} />
        <div
          style={{
            fontSize: '1rem',
            color: isDragging ? '#3b82f6' : (darkMode ? '#fff' : '#000'),
            marginTop: '1rem',
            width: '100%',
            textAlign: 'center',
            transition: 'color 0.2s ease-in-out',
          }}
        >
          {isDragging ? (
            <span>Drop your photos here</span>
          ) : (
            <>
              <div>{t('drag-and-drop-photos-here')}</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.7 }}>
                Supports JPEG, PNG, WebP, HEIC, HEIF
              </div>
            </>
          )}
        </div>
        {error && (
          <div 
            style={{
              color: '#ef4444',
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              textAlign: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPhotoDragInDrop;
