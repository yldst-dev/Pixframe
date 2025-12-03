import { Icon } from 'konsta/react';
import { IoLogoGithub } from 'react-icons/io5';

interface GitHubIconProps {
  size?: number;
  className?: string;
}

const GitHubIcon = ({ size, className }: GitHubIconProps) => {
  return <Icon ios={<IoLogoGithub size={size} className={className} />} />;
};

export default GitHubIcon;