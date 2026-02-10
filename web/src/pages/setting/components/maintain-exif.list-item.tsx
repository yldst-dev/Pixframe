import { ListItem, Toggle } from 'konsta/react';
import { useStore } from '../../../store';
import { useTranslation } from 'react-i18next';
import DatabaseIcon from '../../../icons/database.icon';

const MaintainExifListItem = () => {
  const { t } = useTranslation();
  const { maintainExif, setMaintainExif } = useStore();

  const footer = maintainExif
    ? t('root.settings.maintain-exif.footer.on', 'Original metadata including location (GPS) will be preserved.')
    : t('root.settings.maintain-exif.footer.off', 'Original metadata including location (GPS) will be removed.');

  return (
    <>
      <ListItem
        title={t('root.settings.maintain-exif')}
        footer={footer}
        media={<DatabaseIcon size={26} />}
        after={<Toggle checked={maintainExif} onChange={() => setMaintainExif(!maintainExif)} />}
      />
    </>
  );
};

export default MaintainExifListItem;
