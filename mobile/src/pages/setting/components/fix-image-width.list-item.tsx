import { ListInput, ListItem, Toggle } from 'konsta/react';
import { useStore } from '../../../store';
import { useTranslation } from 'react-i18next';
import ImageWidthIcon from '../../../icons/image-width.icon';

const FixImageWidthListItem = () => {
  const { t } = useTranslation();
  const { enableFixImageWidth, fixImageWidth, setEnableFixImageWidth, setFixImageWidth } = useStore();

  return (
    <>
      <ListItem title={t('root.settings.fix-image-width')} media={<ImageWidthIcon size={26} />} after={<Toggle checked={enableFixImageWidth} onChange={() => setEnableFixImageWidth(!enableFixImageWidth)} />} />

      {enableFixImageWidth && <ListInput floatingLabel label={t('root.settings.image-width')} type="number" value={fixImageWidth} onChange={(e) => setFixImageWidth(parseInt(e.target.value))} />}
    </>
  );
};

export default FixImageWidthListItem;
