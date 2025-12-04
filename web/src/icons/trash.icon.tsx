import { Icon } from 'konsta/react';
import { IoTrashOutline } from 'react-icons/io5';

interface TrashIconProps {
  size?: number;
  className?: string;
}

const TrashIcon = ({ size, className }: TrashIconProps) => {
  return <div className={`flex items-center justify-center ${className || ''}`}><Icon ios={<IoTrashOutline size={size} />} /></div>;
};

export default TrashIcon;
