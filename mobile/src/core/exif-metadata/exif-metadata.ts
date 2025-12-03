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
    this.make = metadata?.Make?.description;
    this.model = metadata?.Model?.description;
    
    // 여러 렌즈 관련 태그를 확인 (LensModel, LensSpec, LensSpecification, Lens 순서로)
    let lensInfo = metadata?.LensModel?.description || 
                   metadata?.LensSpec?.description || 
                   metadata?.LensSpecification?.description ||
                   metadata?.Lens?.description ||
                   metadata?.LensInfo?.description;
    
    // Sony RX100M3의 경우 LensSpecification을 35mm 등가로 변환
    if (lensInfo === "8.8-25.7 mm f/2.8" || lensInfo === "8.8-25.7 mm f/1.8-2.8") {
      lensInfo = "24-70mm F1.8-2.8";
    }
    
    this.lensModel = this.model ? lensInfo?.replace(this.model, '')?.trim() : lensInfo;
    this.focalLength = metadata?.FocalLength?.description?.replace(' mm', 'mm');
    this.focalLengthIn35mm = metadata?.FocalLengthIn35mmFilm?.value
      ? `${metadata?.FocalLengthIn35mmFilm?.value}mm`
      : metadata?.UprightFocalLength35mm?.value
      ? metadata.UprightFocalLength35mm.value.includes('.')
        ? `${metadata.UprightFocalLength35mm.value.split('.').shift()}mm`
        : `${metadata.UprightFocalLength35mm.value}mm`
      : undefined;
    this.fNumber = metadata?.FNumber?.description?.substring(0, 5)?.replace('f/', 'F');
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
