import { ListInput, ListItem, Toggle } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useStore } from '../../../store';
import { useTranslation } from 'react-i18next';
import CameraIcon from '../../../icons/camera.icon';
import { normalizeDecimalInput, parseDecimalInput } from '../../../utils/numeric-input';

const FocalLengthRatioModeListItem = () => {
  const { t } = useTranslation();
  const { focalLengthRatioMode, setFocalLengthRatioMode, focalLengthRatio, setFocalLengthRatio } = useStore();
  const [inputValue, setInputValue] = useState(String(focalLengthRatio));

  useEffect(() => {
    setInputValue(String(focalLengthRatio));
  }, [focalLengthRatio]);

  const commitInputValue = () => {
    const nextValue = parseDecimalInput(inputValue, focalLengthRatio, 0.1);
    setInputValue(String(nextValue));
    setFocalLengthRatio(nextValue);
  };

  return (
    <>
      <ListItem
        title={t('root.settings.focal-length-ratio-mode')}
        media={<CameraIcon size={26} />}
        after={<Toggle checked={focalLengthRatioMode} onChange={() => setFocalLengthRatioMode(!focalLengthRatioMode)} />}
      />

      {focalLengthRatioMode && (
        <ListInput
          floatingLabel
          info={`35mm FF = 1, APS-C = 1.5, APS-C(Canon) = 1.6, Four Thirds = 2, 1" = 2.7`}
          label={t('root.settings.focal-length-ratio')}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={(e) => setInputValue(normalizeDecimalInput(e.target.value))}
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

export default FocalLengthRatioModeListItem;
