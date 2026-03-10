import { shouldUseNativePicker, pickFromLibraryNative, pickFromFilesNative } from './native-image-picker';

export type FileChangeEventLike = {
  target?: {
    files?: FileList | null;
  } | null;
};

export interface FileInputLike {
  type: string;
  accept: string;
  multiple: boolean;
  onchange: ((event: FileChangeEventLike) => void) | null;
  click: () => void;
  remove: () => void;
}

export interface ImageFilePickerDeps {
  createInput: () => FileInputLike;
  appendInput: (input: FileInputLike) => void;
  removeInput: (input: FileInputLike) => void;
}

const createDefaultDeps = (): ImageFilePickerDeps => ({
  createInput: () => document.createElement('input') as unknown as FileInputLike,
  appendInput: (input) => {
    document.body.appendChild(input as unknown as HTMLInputElement);
  },
  removeInput: (input) => {
    input.remove();
  },
});

export interface OpenImageFilePickerOptions {
  multiple?: boolean;
  accept?: string;
}

/**
 * Open an HTML file input picker (used as fallback on non-iOS platforms).
 */
const openHtmlFilePicker = (deps: ImageFilePickerDeps = createDefaultDeps(), options: OpenImageFilePickerOptions = {}): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    const input = deps.createInput();
    input.type = 'file';
    input.multiple = options.multiple ?? true;
    input.accept = options.accept ?? '.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic,.heif';

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      input.onchange = null;
      deps.removeInput(input);
    };

    input.onchange = (event) => {
      const files = event.target?.files ? Array.from(event.target.files) : [];
      cleanup();
      resolve(files);
    };

    deps.appendInput(input);

    try {
      input.click();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
};

/**
 * Open the photo library picker.
 * On iOS: Uses native PHPickerViewController (no camera option).
 * On other platforms: Falls back to HTML file input.
 */
export const openPhotoLibrary = async (
  deps: ImageFilePickerDeps = createDefaultDeps(),
  options: OpenImageFilePickerOptions = {}
): Promise<File[]> => {
  if (shouldUseNativePicker()) {
    try {
      return await pickFromLibraryNative();
    } catch (error) {
      console.error('Native photo library picker failed, falling back to file input:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return openHtmlFilePicker(deps, options);
};

/**
 * Open the file browser picker.
 * On iOS: Uses native UIDocumentPickerViewController.
 * On other platforms: Falls back to HTML file input.
 */
export const openFileBrowser = async (
  deps: ImageFilePickerDeps = createDefaultDeps(),
  options: OpenImageFilePickerOptions = {}
): Promise<File[]> => {
  if (shouldUseNativePicker()) {
    try {
      return await pickFromFilesNative();
    } catch (error) {
      console.error('Native file browser failed, falling back to file input:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return openHtmlFilePicker(deps, options);
};
