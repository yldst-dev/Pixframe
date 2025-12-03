import { Icon } from 'konsta/react';
import { IoAddOutline } from 'react-icons/io5';

interface AddIconProps {
  size?: number;
  className?: string;
}

const AddIcon = ({ size, className }: AddIconProps) => {
  return <div className={`flex items-center justify-center ${className || ''}`}><Icon ios={<IoAddOutline size={size} />} /></div>;
};

export default AddIcon;
