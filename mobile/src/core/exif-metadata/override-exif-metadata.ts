import { SafeStorage } from '../../utils/safe-storage';

const overrideExifMetadata = () => {
  const overridableMetadata = SafeStorage.getJSONItem<{ [key: string]: string }[]>('overridableMetadata', []);
  const overrideMetadataIndex = SafeStorage.getJSONItem<number | null>('overrideMetadataIndex', null);
  const metadata = overrideMetadataIndex == null ? null : overridableMetadata.length > overrideMetadataIndex ? overridableMetadata[overrideMetadataIndex] : null;
  return metadata;
};

export default overrideExifMetadata;
