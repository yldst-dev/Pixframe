export const getExportFormat = (_filename: string, exportToJpeg: boolean) => {
  const useJpeg = exportToJpeg;
  const extension = useJpeg ? 'jpg' : 'png';
  return {
    mimeType: useJpeg ? 'image/jpeg' : 'image/png',
    extension,
    useJpeg,
  };
};
