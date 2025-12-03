import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import Toggle from '../ui/toggle';
import Button from '../ui/button';

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

  const SettingItem: React.FC<{
    title: string;
    description?: string;
    children: React.ReactNode;
  }> = ({ title, description, children }) => (
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



  return (
    <div className="p-4 space-y-6">
      {/* Output Format */}
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

        <SettingItem
          title={t('export.quality', 'Quality')}
          description={t('export.quality.description', 'Higher quality = larger file size')}
        >
          <div className="space-y-2">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('export.quality.low', '낮음 (10%)')}</span>
              <span className="font-medium">{Math.round(quality * 100)}%</span>
              <span>{t('export.quality.high', '높음 (100%)')}</span>
            </div>
          </div>
        </SettingItem>

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
                    type="number"
                    value={fixImageWidth}
                    onChange={(e) => setFixImageWidth(parseInt(e.target.value))}
                    min="100"
                    max="4000"
                    step="100"
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
                      onClick={() => setFixImageWidth(width)}
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

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      {/* Metadata Display */}
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

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {t('export.advanced', 'Advanced Options')}
        </h3>

        <div className="space-y-4">
          <Toggle
            checked={maintainExif}
            onChange={setMaintainExif}
            label={t('export.maintain-exif', 'Preserve Original EXIF Data')}
          />
        </div>
      </div>

      {/* Export Actions */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <Button 
          variant="primary" 
          className="w-full"
        >
          {t('export.apply-to-all', 'Apply to All Images')}
        </Button>
        
        <Button 
          variant="secondary" 
          className="w-full"
        >
          {t('export.reset-defaults', 'Reset to Defaults')}
        </Button>
      </div>
    </div>
  );
};

export default ExportSettings;