import React, { useCallback } from 'react';
import { Button } from 'konsta/react';
import Photo from '../../../core/photo';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store';
import { IoImagesOutline, IoFolderOpenOutline } from 'react-icons/io5';
import { openPhotoLibrary, openFileBrowser } from '../../../utils/image-file-picker';

const AddPhotoButton = () => {
  const { t } = useTranslation();
  const { photos, setPhotos, setLoading, setOpenedAddPhotoErrorDialog } = useStore();

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    setLoading(true);
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;
    if (!files) return;
    try {
      await Promise.all(Array.from(files).map(Photo.create)).then((newPhotos) => {
        setPhotos([...photos, ...newPhotos]);
      });
    } catch (e) {
      console.error(e);
      setOpenedAddPhotoErrorDialog(true);
    }
    setLoading(false);
  };

  const handleAddPhotos = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        const newPhotos = await Promise.all(files.map(Photo.create));
        setPhotos([...photos, ...newPhotos]);
      } catch (e) {
        console.error(e);
        setOpenedAddPhotoErrorDialog(true);
      }
      setLoading(false);
    },
    [photos, setPhotos, setLoading, setOpenedAddPhotoErrorDialog],
  );

  const handlePhotoLibraryClick = useCallback(() => {
    void openPhotoLibrary()
      .then((files) => handleAddPhotos(files))
      .catch((error) => {
        console.error('Photo library picker error:', error instanceof Error ? error.message : 'Unknown error');
      });
  }, [handleAddPhotos]);

  const handleFileBrowserClick = useCallback(() => {
    void openFileBrowser()
      .then((files) => handleAddPhotos(files))
      .catch((error) => {
        console.error('File browser error:', error instanceof Error ? error.message : 'Unknown error');
      });
  }, [handleAddPhotos]);

  return (
    <div onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop} className="flex flex-col gap-1">
      <Button clear onClick={handlePhotoLibraryClick}>
        <IoImagesOutline size={18} />
        <div style={{ width: 4 }} />
        {t('picker.photo-library', 'Photo Library')}
      </Button>
      <Button clear onClick={handleFileBrowserClick}>
        <IoFolderOpenOutline size={18} />
        <div style={{ width: 4 }} />
        {t('picker.browse-files', 'Browse Files')}
      </Button>
    </div>
  );
};

export default AddPhotoButton;
