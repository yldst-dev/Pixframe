import { ListInput, ListItem, Toggle } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useStore } from '../../../store';
import { useTranslation } from 'react-i18next';
import ImageWidthIcon from '../../../icons/image-width.icon';
import { normalizeIntegerInput, parseIntegerInput } from '../../../utils/numeric-input';

const FIX_IMAGE_WIDTH_MIN = 100;
const FIX_IMAGE_WIDTH_MAX = 4000;
const FIX_IMAGE_WIDTH_FALLBACK = 1920;

const FixImageWidthListItem = () => {
  const { t } = useTranslation();
  const { enableFixImageWidth, fixImageWidth, setEnableFixImageWidth, setFixImageWidth } = useStore();
  const [inputValue, setInputValue] = useState(String(fixImageWidth));

  useEffect(() => {
    setInputValue(String(fixImageWidth));
  }, [fixImageWidth]);

  const commitInputValue = () => {
    const fallback = Number.isFinite(fixImageWidth) ? fixImageWidth : FIX_IMAGE_WIDTH_FALLBACK;
    const nextValue = parseIntegerInput(inputValue, fallback, FIX_IMAGE_WIDTH_MIN, FIX_IMAGE_WIDTH_MAX);
    setInputValue(String(nextValue));
    setFixImageWidth(nextValue);
  };

  return (
    <>
      <ListItem title={t('root.settings.fix-image-width')} media={<ImageWidthIcon size={26} />} after={<Toggle checked={enableFixImageWidth} onChange={() => setEnableFixImageWidth(!enableFixImageWidth)} />} />

      {enableFixImageWidth && (
        <ListInput
          floatingLabel
          label={t('root.settings.image-width')}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={(e) => setInputValue(normalizeIntegerInput(e.target.value))}
          onBlur={commitInputValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      )}
    </>
  );
};

export default FixImageWidthListItem;
