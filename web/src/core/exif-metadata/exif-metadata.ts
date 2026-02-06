import { Tags } from 'exifreader';

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

    const focalLength = metadata?.FocalLength?.description?.replace(' mm', 'mm');
    const focalLengthIn35mm = metadata?.FocalLengthIn35mmFilm?.value
      ? `${metadata?.FocalLengthIn35mmFilm?.value}mm`
      : metadata?.UprightFocalLength35mm?.value
      ? metadata.UprightFocalLength35mm.value.includes('.')
        ? `${metadata.UprightFocalLength35mm.value.split('.').shift()}mm`
        : `${metadata.UprightFocalLength35mm.value}mm`
      : undefined;
    const fNumber = metadata?.FNumber?.description?.substring(0, 5)?.replace('f/', 'F');

    // 여러 렌즈 관련 태그를 확인 (LensModel, LensSpec, LensSpecification, Lens 순서로)
    let lensInfo: string | undefined = metadata?.LensModel?.description ||
                   metadata?.LensSpec?.description ||
                   metadata?.LensSpecification?.description ||
                   metadata?.Lens?.description ||
                   metadata?.LensInfo?.description;

    // Sony RX100M3의 경우 LensSpecification을 35mm 등가로 변환
    if (lensInfo === '8.8-25.7 mm f/2.8' || lensInfo === '8.8-25.7 mm f/1.8-2.8') {
      lensInfo = '24-70mm F1.8-2.8';
    }

    // Some cameras (e.g. fixed-lens compacts) don't write LensModel/LensSpecification.
    // Fallback to something meaningful so Strap's {LENS} line isn't blank.
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
