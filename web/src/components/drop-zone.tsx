import React from 'react';
import { useTranslation } from 'react-i18next';
import ImageIcon from '../icons/image.icon';
import AddIcon from '../icons/add.icon';
import Button from './ui/button';
import { pickImageFiles } from '../utils/image-files';

interface DropZoneProps {
  onAddPhotos: (files: File[] | FileList) => Promise<void>;
}

const DropZone: React.FC<DropZoneProps> = ({ onAddPhotos }) => {
  const { t } = useTranslation();
  const handleFileSelect = () => pickImageFiles((files) => void onAddPhotos(files));

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div
        onClick={handleFileSelect}
        className="group w-full max-w-2xl h-96 px-8 border-2 border-dashed border-border bg-background/60 hover:border-foreground/30 hover:bg-background transition-colors cursor-pointer flex flex-col items-center justify-center gap-6 text-center"
      >
        <div className="w-16 h-16 flex items-center justify-center border border-border bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
          <ImageIcon size={32} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">{t('dropzone.title', 'Add your photos')}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{t('dropzone.description', 'Drag and drop your images here, or click to browse')}</p>
        </div>

        <Button
          variant="primary"
          className="uppercase text-xs font-bold tracking-wide"
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelect();
          }}
        >
          <AddIcon size={16} />
          <span className="ml-2">{t('dropzone.browse', 'Browse Files')}</span>
        </Button>

        <p className="text-xs font-mono text-muted-foreground">{t('dropzone.formats', 'Supports: JPG, PNG, HEIC, and more')}</p>
      </div>
    </div>
  );
};

export default DropZone;
