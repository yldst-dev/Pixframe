import { Capacitor } from '@capacitor/core';

interface NativeFileData {
  base64: string;
  mimeType: string;
  filename: string;
}

interface PhotoLibraryPickerPlugin {
  pickFromLibrary(): Promise<{ files: NativeFileData[] }>;
  pickFromFiles(): Promise<{ files: NativeFileData[] }>;
}

/**
 * Convert base64 file data array to File objects.
 */
const convertNativeFilesToFiles = (fileDataArray: NativeFileData[]): File[] => {
  const files: File[] = [];

  for (const fileData of fileDataArray) {
    try {
      const binaryString = atob(fileData.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: fileData.mimeType });
      const file = new File([blob], fileData.filename, { type: fileData.mimeType });
      files.push(file);
    } catch (error) {
      console.error('Failed to convert native picked image:', fileData.filename, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return files;
};

/**
 * Get the native plugin instance.
 */
const getNativePlugin = (): PhotoLibraryPickerPlugin | undefined => {
  const plugins = (Capacitor as unknown as { Plugins: Record<string, unknown> }).Plugins;
  return plugins?.['PhotoLibraryPicker'] as PhotoLibraryPickerPlugin | undefined;
};

/**
 * Pick images from the native iOS Photo Library (PHPicker).
 * Opens the photo library directly without any action sheet.
 */
export const pickFromLibraryNative = async (): Promise<File[]> => {
  const plugin = getNativePlugin();
  if (!plugin) {
    throw new Error('PhotoLibraryPicker plugin is not available');
  }

  const result = await plugin.pickFromLibrary();
  const fileDataArray = result.files ?? [];

  if (fileDataArray.length === 0) {
    return [];
  }

  return convertNativeFilesToFiles(fileDataArray);
};

/**
 * Pick images from the native iOS file browser (UIDocumentPicker).
 * Opens the Files app directly without any action sheet.
 */
export const pickFromFilesNative = async (): Promise<File[]> => {
  const plugin = getNativePlugin();
  if (!plugin) {
    throw new Error('PhotoLibraryPicker plugin is not available');
  }

  const result = await plugin.pickFromFiles();
  const fileDataArray = result.files ?? [];

  if (fileDataArray.length === 0) {
    return [];
  }

  return convertNativeFilesToFiles(fileDataArray);
};

/**
 * Check if we should use the native iOS photo library picker
 * instead of the standard HTML file input.
 */
export const shouldUseNativePicker = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};
