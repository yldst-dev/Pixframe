import { ChangeEvent } from 'react';
import { ListButton } from 'konsta/react';
import { useTranslation } from 'react-i18next';
import Photo from '../../../../core/photo';
import AddIcon from '../../../../icons/add.icon';
import { useStore } from '../store';
import * as Root from '../../../../store';

const AddPhotoButton = () => {
  const { t } = useTranslation();
  const { photos, setPhotos, setLoading, setLoadingProgress } = useStore();
  const { setOpenedAddPhotoErrorDialog } = Root.useStore();

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setLoading(true);
    setLoadingProgress({ current: 0, total: fileArray.length, currentFileName: fileArray[0]?.name || '' });

    try {
      const newPhotos: Photo[] = [];
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        // Use 1-based "current" so the fill is visible even for single-file imports.
        setLoadingProgress({ current: i + 1, total: fileArray.length, currentFileName: file.name });
        try {
          const photo = await Photo.create(file);
          newPhotos.push(photo);
        } catch (e) {
          console.error(e);
        }
      }

      if (newPhotos.length === 0) {
        setOpenedAddPhotoErrorDialog(true);
      } else {
        setPhotos([...photos, ...newPhotos]);
      }
    } finally {
      setLoading(false);
    }
  };

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
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const { files } = event.target;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  return (
    <>
      <input type="file" accept="image/*" onChange={onChange} onClick={(e) => (e.currentTarget.value = '')} multiple hidden />

      <ListButton
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => {
          const input: HTMLInputElement | null = document.querySelector('input[type="file"]');
          if (input) input.click();
        }}
      >
        <AddIcon size={18} />
        <div style={{ width: 4 }} />
        {t('root.add-photo')}
      </ListButton>
    </>
  );
};

export default AddPhotoButton;
