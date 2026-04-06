export const createObjectUrl = (blob: Blob): string => URL.createObjectURL(blob);

export const revokeObjectUrl = (url?: string | null): void => {
  if (!url) {
    return;
  }

  URL.revokeObjectURL(url);
};

export const blobToDataUrl = async (blob: Blob): Promise<string> =>
  await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read blob as data URL'));
    };
    reader.onerror = () => reject(new Error('Failed to read blob as data URL'));
    reader.readAsDataURL(blob);
  });

export const inputToBlob = async (input: Blob | string): Promise<Blob> => {
  if (input instanceof Blob) {
    return input;
  }

  const response = await fetch(input);

  if (!response.ok) {
    throw new Error('Failed to convert input to blob');
  }

  return await response.blob();
};
