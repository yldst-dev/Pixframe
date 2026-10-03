const IMAGE_FILE_ACCEPT = 'image/*,.heic,.heif';

export const isImageFile = (file: File): boolean => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);

export const pickImageFiles = (onFiles: (files: FileList) => void) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = IMAGE_FILE_ACCEPT;
  input.onchange = () => {
    if (input.files && input.files.length > 0) {
      onFiles(input.files);
    }
  };
  input.click();
};
