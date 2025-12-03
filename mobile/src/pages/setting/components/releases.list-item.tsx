import { ListItem } from 'konsta/react';
import { useTranslation } from 'react-i18next';
import PullRequestIcon from '../../../icons/pull-request.icon';

const ReleasesListItem = () => {
  const { t } = useTranslation();

  return <ListItem media={<PullRequestIcon size={26} />} title={t('root.releases')} link onClick={() => window.open('https://github.com/yldst-dev/Pixframe/releases')} />;
};

export default ReleasesListItem;
