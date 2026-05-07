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

const SettingItem: React.FC<SettingItemProps> = ({ title, description, children }) => (
  <div className="space-y-2">
    <div>
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {title}
      </div>
      {description && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
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
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {t('export.format', 'Output Format')}
        </h3>
        
        <SettingItem
          title={t('export.format.type', 'File Format')}
          description={t('export.format.type.description', 'Choose output file format')}
        >
          <Toggle
            checked={exportToJpeg}
            onChange={setExportToJpeg}
            label={exportToJpeg ? 'JPEG' : 'PNG'}
          />
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
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{t('export.quality.low', '낮음 (10%)')}</span>
                <span className="font-medium">{Math.round(quality * 100)}%</span>
                <span>{t('export.quality.high', '높음 (100%)')}</span>
              </div>
            </div>
          </SettingItem>
        )}

        <SettingItem
          title={t('export.width.enable', '너비 고정')}
          description={t('export.width.enable.description', '모든 이미지를 동일한 너비로 출력합니다')}
        >
          <div className="space-y-3">
            <Toggle
              checked={enableFixImageWidth}
              onChange={setEnableFixImageWidth}
              label={enableFixImageWidth ? t('export.width.enabled', '너비 고정 활성화') : t('export.width.disabled', '원본 크기 유지')}
            />
            
            {enableFixImageWidth && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-3">
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
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">px</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('export.width.range', '범위: 100 ~ 4000px (권장: 1920px)')}
                </div>
                <div className="flex space-x-2">
                  {[1080, 1920, 2560, 3840].map(width => (
                    <button
                      key={width}
                      onClick={() => handleFixImageWidthPreset(width)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        fixImageWidth === width
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {width}p
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SettingItem>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
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

      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {t('export.advanced', 'Advanced Options')}
        </h3>

        <div className="space-y-4">
          <div className="space-y-1">
            <Toggle
              checked={maintainExif}
              onChange={setMaintainExif}
              label={t('export.maintain-exif', 'Preserve Original EXIF Data')}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {maintainExifDescription}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExportSettings;
