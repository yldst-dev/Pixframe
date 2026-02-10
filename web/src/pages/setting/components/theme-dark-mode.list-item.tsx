import { ListItem, Toggle } from 'konsta/react';
import { useStore } from '../../../store';
import { useTranslation } from 'react-i18next';
import ImageIcon from '../../../icons/image.icon';

const ThemeDarkModeListItem = () => {
  const { t } = useTranslation();
  const { themeDarkMode, setThemeDarkMode, setRerenderOptions } = useStore();

  const handleToggle = () => {
    setThemeDarkMode(!themeDarkMode);
    setRerenderOptions();
  };

  return (
    <ListItem
      media={<ImageIcon size={26} />}
      title={t('root.settings.theme-dark-mode')}
      after={<Toggle checked={themeDarkMode} onChange={handleToggle} />}
    />
  );
};

export default ThemeDarkModeListItem;
