import { ListInput, ListItem, Toggle } from 'konsta/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CameraIcon from '../../../icons/camera.icon';
import { useStore } from '../../../store';
import { normalizeDecimalInput, parseDecimalInput } from '../../../utils/numeric-input';

const FocalLengthRatioModeListItem = () => {
  const { t } = useTranslation();
  const { focalLengthRatioMode, setFocalLengthRatioMode, focalLengthRatio, setFocalLengthRatio } = useStore();
  const [focalLengthRatioInput, setFocalLengthRatioInput] = useState(String(focalLengthRatio));

  useEffect(() => {
    setFocalLengthRatioInput(String(focalLengthRatio));
  }, [focalLengthRatio]);

  const commitFocalLengthRatio = () => {
    const fallback = Number.isFinite(focalLengthRatio) ? focalLengthRatio : 1;
    const nextValue = parseDecimalInput(focalLengthRatioInput, fallback, 0.1);
    setFocalLengthRatioInput(String(nextValue));
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
          value={focalLengthRatioInput}
          onChange={(e) => setFocalLengthRatioInput(normalizeDecimalInput(e.target.value))}
          onBlur={commitFocalLengthRatio}
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
