import { Tags } from 'exifreader';

const KNOWN_35MM_SCALE_FACTORS: Record<string, number> = {
  'canon|canon powershot v1': 50 / 25.6,
  'canon|powershot v1': 50 / 25.6,
};

interface NumericTagLike {
  description?: string;
  value?: unknown;
}

const getTagNumber = (tag: NumericTagLike | undefined): number | undefined => {
  const value = tag?.value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number' && value[1] !== 0) {
      return value[0] / value[1];
    }
    if (value.length === 1 && typeof value[0] === 'number') {
      return value[0];
    }
  }

  const description = tag?.description;
  if (typeof description === 'string') {
    const parsed = Number(description.match(/[\d.]+/)?.[0]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const formatFocalLength = (value: number): string => {
  const roundedInteger = Math.round(value);
  if (Math.abs(value - roundedInteger) < 0.05) {
    return `${roundedInteger}mm`;
  }

  return `${Number(value.toFixed(1))}mm`;
};

const getKnown35mmScaleFactor = (make: string | undefined, model: string | undefined): number | undefined => {
  const key = `${make || ''}|${model || ''}`.toLowerCase();
  return KNOWN_35MM_SCALE_FACTORS[key];
};

class ExifMetadata {
  public make: string | undefined;
  public model: string | undefined;
  public lensModel: string | undefined;
  public focalLength: string | undefined;
  public focalLengthIn35mm: string | undefined;
  public fNumber: string | undefined;
  public iso: string | undefined;
  public exposureTime: string | undefined;
  public thumbnail: string | undefined;
  public takenAt: string | undefined;

  constructor(metadata: Tags) {
    const make = metadata?.Make?.description?.trim();
    let model = metadata?.Model?.description?.trim();

    if (make && model) {
      const makeLower = make.toLowerCase();
      const modelLower = model.toLowerCase();
      if (modelLower.startsWith(makeLower)) {
        model = model.slice(make.length).trim();
      }
    }

    this.make = make;
    this.model = model;

    const focalLengthValue = getTagNumber(metadata?.FocalLength);
    const focalLength = focalLengthValue ? formatFocalLength(focalLengthValue) : metadata?.FocalLength?.description?.replace(' mm', 'mm');
    const focalLength35mmFilmValue = getTagNumber(metadata?.FocalLengthIn35mmFilm);
    const uprightFocalLength35mmValue = getTagNumber(metadata?.UprightFocalLength35mm);
    const known35mmScaleFactor = getKnown35mmScaleFactor(make, model);
    const focalLengthIn35mmValue = focalLength35mmFilmValue || uprightFocalLength35mmValue || (focalLengthValue && known35mmScaleFactor ? focalLengthValue * known35mmScaleFactor : undefined);
    const focalLengthIn35mm = focalLengthIn35mmValue ? formatFocalLength(focalLengthIn35mmValue) : undefined;
    const fNumber = metadata?.FNumber?.description?.substring(0, 5)?.replace('f/', 'F');

    let lensInfo: string | undefined = metadata?.LensModel?.description ||
                   metadata?.LensSpec?.description ||
                   metadata?.LensSpecification?.description ||
                   metadata?.Lens?.description ||
                   metadata?.LensInfo?.description;

    if (lensInfo === '8.8-25.7 mm f/2.8' || lensInfo === '8.8-25.7 mm f/1.8-2.8') {
      lensInfo = '24-70mm F1.8-2.8';
    }

    if (!lensInfo) {
      const fallbackLensParts: string[] = [];
      const fl = focalLengthIn35mm || focalLength;
      if (fl) fallbackLensParts.push(fl);
      if (fNumber) fallbackLensParts.push(fNumber);
      const fallbackLens = fallbackLensParts.join(' ');
      lensInfo = fallbackLens || undefined;
    }

    this.lensModel = this.model ? lensInfo?.replace(this.model, '')?.trim() : lensInfo;
    this.focalLength = focalLength;
    this.focalLengthIn35mm = focalLengthIn35mm;
    this.fNumber = fNumber;
    this.iso = metadata?.ISOSpeedRatings?.value ? 'ISO' + metadata?.ISOSpeedRatings?.value?.toString() : undefined;
    this.exposureTime = metadata?.ExposureTime?.description ? metadata?.ExposureTime?.description + 's' : undefined;
    this.thumbnail = metadata?.Thumbnail?.base64 ? 'data:image/jpg;base64,' + metadata?.Thumbnail?.base64 : undefined;

    if (metadata?.DateTimeOriginal?.description) {
      const yyyymmdd = metadata.DateTimeOriginal.description.split(' ')[0].split(':').join('-');
      const hhmmss = metadata.DateTimeOriginal.description.split(' ')[1];
      this.takenAt = `${yyyymmdd} ${hhmmss}`;
    }
  }
}

export default ExifMetadata;
