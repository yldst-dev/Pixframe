const UNITS = ['B', 'KB', 'MB', 'GB'];

export const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(value < 10 ? 2 : 1)} ${UNITS[exponent]}`;
};
