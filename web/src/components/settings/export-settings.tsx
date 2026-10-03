import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import Toggle from '../ui/toggle';
import Slider from '../ui/slider';
import { normalizeIntegerInput, parseIntegerInput } from '../../utils/numeric-input';

interface SettingItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const FIX_IMAGE_WIDTH_MIN = 100;
const FIX_IMAGE_WIDTH_MAX = 4000;
const FIX_IMAGE_WIDTH_FALLBACK = 1920;
const FIX_IMAGE_WIDTH_PRESETS = [1080, 1920, 2560, 3840];
const FORMAT_OPTIONS = [
  { label: 'JPEG', isJpeg: true },
  { label: 'PNG', isJpeg: false },
];
const SECTION_TITLE_CLASS = 'text-sm font-bold uppercase tracking-wider text-foreground';

const SettingItem: React.FC<SettingItemProps> = ({ title, description, children }) => (
  <div className="space-y-2">
    <div>
      <div className="text-sm font-medium text-foreground">
        {title}
      </div>
      {description && (
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
      )}
    </div>
    {children}
  </div>
);

const ExportSettings = () => {
  const { t } = useTranslation();
  const { 
    quality,
    setQuality,
    exportToJpeg,
    setExportToJpeg,
    fixImageWidth,
    setFixImageWidth,
    enableFixImageWidth,
    setEnableFixImageWidth,
    showCameraMaker,
    setShowCameraMaker,
    showCameraModel,
    setShowCameraModel,
    showLensModel,
    setShowLensModel,
    maintainExif,
    setMaintainExif
  } = useStore();
  const [fixImageWidthInput, setFixImageWidthInput] = React.useState(String(fixImageWidth));

  React.useEffect(() => {
    setFixImageWidthInput(String(fixImageWidth));
  }, [fixImageWidth]);

  const commitFixImageWidth = React.useCallback(() => {
    const fallback = Number.isFinite(fixImageWidth) ? fixImageWidth : FIX_IMAGE_WIDTH_FALLBACK;
    const value = parseIntegerInput(fixImageWidthInput, fallback, FIX_IMAGE_WIDTH_MIN, FIX_IMAGE_WIDTH_MAX);
    setFixImageWidthInput(String(value));
    setFixImageWidth(value);
  }, [fixImageWidth, fixImageWidthInput, setFixImageWidth]);

  const handleFixImageWidthPreset = React.useCallback((width: number) => {
    setFixImageWidthInput(String(width));
    setFixImageWidth(width);
  }, [setFixImageWidth]);

  const maintainExifDescription = !maintainExif
    ? t('export.maintain-exif.description.off', 'Original metadata including location (GPS) will be removed.')
    : exportToJpeg
      ? t('export.maintain-exif.description.on', 'Original metadata including location (GPS) will be preserved.')
      : t('export.maintain-exif.description.png', 'Original metadata will be written to the PNG eXIf chunk. Some viewers may show limited details.');

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <h3 className={SECTION_TITLE_CLASS}>
          {t('export.format', 'Output Format')}
        </h3>

        <SettingItem
          title={t('export.format.type', 'File Format')}
          description={t('export.format.type.description', 'Choose output file format')}
        >
          <div role="radiogroup" aria-label={t('export.format.type', 'File Format')} className="inline-flex border border-input">
            {FORMAT_OPTIONS.map(({ label, isJpeg }) => {
              const isActive = exportToJpeg === isJpeg;
              return (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setExportToJpeg(isJpeg)}
                  className={`px-5 py-1.5 text-xs font-bold font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </SettingItem>

        {exportToJpeg && (
          <SettingItem
            title={t('export.quality', 'Quality')}
            description={t('export.quality.description', 'Higher quality = larger file size')}
          >
            <div className="space-y-2">
              <Slider
                min={0.1}
                max={1}
                step={0.1}
                value={quality}
                onChange={setQuality}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('export.quality.low', 'Low (10%)')}</span>
                <span className="font-mono font-medium text-foreground">{Math.round(quality * 100)}%</span>
                <span>{t('export.quality.high', 'High (100%)')}</span>
              </div>
            </div>
          </SettingItem>
        )}

        <SettingItem
          title={t('export.width.enable', 'Fix Width')}
          description={t('export.width.enable.description', 'Export every image at the same width')}
        >
          <div className="space-y-3">
            <Toggle
              checked={enableFixImageWidth}
              onChange={setEnableFixImageWidth}
              label={enableFixImageWidth ? t('export.width.enabled', 'Fixed width enabled') : t('export.width.disabled', 'Keep original size')}
            />

            {enableFixImageWidth && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={fixImageWidthInput}
                    onChange={(e) => setFixImageWidthInput(normalizeIntegerInput(e.target.value))}
                    onBlur={commitFixImageWidth}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-24 px-2 py-1.5 text-sm font-mono border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('export.width.range', 'Range: 100 to 4000px (recommended: 1920px)')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {FIX_IMAGE_WIDTH_PRESETS.map((width) => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => handleFixImageWidthPreset(width)}
                      className={`px-2 py-1 text-xs font-mono border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        fixImageWidth === width
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {width}px
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SettingItem>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>
          {t('export.metadata', 'Metadata Display')}
        </h3>

        <div className="space-y-4">
          <Toggle
            checked={showCameraMaker}
            onChange={setShowCameraMaker}
            label={t('export.show-camera-maker', 'Show Camera Maker')}
          />

          <Toggle
            checked={showCameraModel}
            onChange={setShowCameraModel}
            label={t('export.show-camera-model', 'Show Camera Model')}
          />

          <Toggle
            checked={showLensModel}
            onChange={setShowLensModel}
            label={t('export.show-lens-model', 'Show Lens Model')}
          />
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <h3 className={SECTION_TITLE_CLASS}>
          {t('export.advanced', 'Advanced Options')}
        </h3>

        <Toggle
          checked={maintainExif}
          onChange={setMaintainExif}
          label={t('export.maintain-exif', 'Preserve Original EXIF Data')}
          description={maintainExifDescription}
        />
      </div>
    </div>
  );
};

export default ExportSettings;
