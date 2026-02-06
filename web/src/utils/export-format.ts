export const getExportFormat = (filename: string, exportToJpeg: boolean) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const isJpeg = ext === 'jpg' || ext === 'jpeg';
  const useJpeg = exportToJpeg || isJpeg;
  const extension = exportToJpeg ? 'jpg' : isJpeg ? ext || 'jpg' : 'png';
  return {
    mimeType: useJpeg ? 'image/jpeg' : 'image/png',
    extension,
    useJpeg
  };
};
