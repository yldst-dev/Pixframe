import { load, type Tags } from 'exifreader';
import ExifMetadata from './exif-metadata/exif-metadata';
import overrideExifMetadata from './exif-metadata/override-exif-metadata';
import { SafeStorage } from '../utils/safe-storage';

class Photo {
  private constructor() {}

  public file!: File;
  public metadata!: ExifMetadata;
  public image!: HTMLImageElement;
  public imageBase64!: string;
  public thumbnail!: string;

  public static async create(file: File): Promise<Photo> {
    const photo = new Photo();

    const isHeif = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    const metadataPromise = load(file).catch((error) => {
      console.error('Failed to parse EXIF metadata:', error);
      return {} as Tags;
    });

    let processedFile = file;

    if (isHeif) {
      try {
        const { default: heic2any } = await import('heic2any');
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/png',
        }) as Blob;

        const originalName = file.name.replace(/\.(heic|heif)$/i, '');
        processedFile = new File([convertedBlob], `${originalName}.png`, {
          type: 'image/png',
          lastModified: file.lastModified,
        });
      } catch (error) {
        console.error('Failed to convert HEIC/HEIF file:', error);
        throw new Error(`Failed to process HEIC/HEIF file: ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    photo.file = processedFile;
    photo.image = new Image();
    const objectUrl = URL.createObjectURL(processedFile);
    photo.image.src = objectUrl;

    try {
      await Promise.all([
        new Promise((resolve, reject) => {
          photo.image.onload = resolve;
          photo.image.onerror = () => reject(new Error(`Failed to load image: ${processedFile.name}`));
        }),
        metadataPromise,
      ]);
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    }

    const metadata = await metadataPromise;
    photo.metadata = new ExifMetadata(metadata);
    photo.imageBase64 = '';
    photo.thumbnail = objectUrl;
    return photo;
  }

  public get make(): string {
    if (!SafeStorage.getBooleanItem('showCameraMaker', true)) return '';
    return overrideExifMetadata()?.make || this.metadata.make || '';
  }

  public get model(): string {
    if (!SafeStorage.getBooleanItem('showCameraModel', true)) return '';
    return overrideExifMetadata()?.model || this.metadata.model || '';
  }

  public get lensModel(): string {
    if (!SafeStorage.getBooleanItem('showLensModel', true)) {
      return '';
    }
    
    return overrideExifMetadata()?.lensModel || this.metadata.lensModel || '';
  }

  public get focalLength(): string {
    if (SafeStorage.getBooleanItem('focalLengthRatioMode', false)) {
      const focalLength = parseFloat(overrideExifMetadata()?.focalLength?.replace(' mm', '') || this.metadata?.focalLength?.replace(' mm', '') || '0');
      return (focalLength * SafeStorage.getNumberItem('focalLengthRatio', 1)).toFixed(0) + 'mm';
    }
    return !SafeStorage.getBooleanItem('focalLength35mmMode', true)
      ? overrideExifMetadata()?.focalLength || this.metadata.focalLength || ''
      : overrideExifMetadata()?.focalLengthIn35mm || this.metadata.focalLengthIn35mm || overrideExifMetadata()?.focalLength || this.metadata.focalLength || '';
  }

  public get fNumber(): string {
    return overrideExifMetadata()?.fNumber || this.metadata.fNumber || '';
  }

  public get iso(): string {
    return overrideExifMetadata()?.iso || this.metadata.iso || '';
  }

  public get exposureTime(): string {
    return overrideExifMetadata()?.exposureTime || this.metadata.exposureTime || '';
  }

  public get takenAt(): string {
    if (!overrideExifMetadata()?.takenAt && !this.metadata.takenAt) return '';

    const takenAt = new Date(overrideExifMetadata()?.takenAt || this.metadata.takenAt!);
    switch (SafeStorage.getItem('dateNotation', '2001/01/01 01:01:01') as string) {
      case '2001/01/01 01:01:01':
        return `${takenAt.getFullYear()}/${(takenAt.getMonth() + 1).toString().padStart(2, '0')}/${takenAt.getDate().toString().padStart(2, '0')} ${takenAt
          .getHours()
          .toString()
          .padStart(2, '0')}:${takenAt.getMinutes().toString().padStart(2, '0')}:${takenAt.getSeconds().toString().padStart(2, '0')}`;

      case '2001-01-01 01:01:01':
        return `${takenAt.getFullYear()}-${(takenAt.getMonth() + 1).toString().padStart(2, '0')}-${takenAt.getDate().toString().padStart(2, '0')} ${takenAt
          .getHours()
          .toString()
          .padStart(2, '0')}:${takenAt.getMinutes().toString().padStart(2, '0')}:${takenAt.getSeconds().toString().padStart(2, '0')}`;

      case '2001年01月01日 01時01分':
        return `${takenAt.getFullYear()}年${(takenAt.getMonth() + 1).toString().padStart(2, '0')}月${takenAt.getDate().toString().padStart(2, '0')}日 ${takenAt
          .getHours()
          .toString()
          .padStart(2, '0')}時${takenAt.getMinutes().toString().padStart(2, '0')}分`;

      case '2001년 01월 01일 01시 01분':
        return `${takenAt.getFullYear()}년 ${(takenAt.getMonth() + 1).toString().padStart(2, '0')}월 ${takenAt.getDate().toString().padStart(2, '0')}일 ${takenAt
          .getHours()
          .toString()
          .padStart(2, '0')}시 ${takenAt.getMinutes().toString().padStart(2, '0')}분`;

      case '2001/01/01':
        return `${takenAt.getFullYear()}/${(takenAt.getMonth() + 1).toString().padStart(2, '0')}/${takenAt.getDate().toString().padStart(2, '0')}`;

      case '2001-01-01':
        return `${takenAt.getFullYear()}-${(takenAt.getMonth() + 1).toString().padStart(2, '0')}-${takenAt.getDate().toString().padStart(2, '0')}`;

      case '2001年01月01日':
        return `${takenAt.getFullYear()}年${(takenAt.getMonth() + 1).toString().padStart(2, '0')}月${takenAt.getDate().toString().padStart(2, '0')}日`;

      case '2001년 01월 01일':
        return `${takenAt.getFullYear()}년 ${(takenAt.getMonth() + 1).toString().padStart(2, '0')}월 ${takenAt.getDate().toString().padStart(2, '0')}일`;

      case 'Jan 1, 2001':
        return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][takenAt.getMonth()]} ${takenAt.getDate().toString().padStart(2, '0')}, ${takenAt.getFullYear()}`;

      default:
        return '';
    }
  }
}

export default Photo;
