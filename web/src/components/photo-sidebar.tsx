import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import AddIcon from '../icons/add.icon';
import Button from './ui/button';
import { pickImageFiles } from '../utils/image-files';
import { formatFileSize } from '../utils/format-file-size';
import { getShortMakerName } from '../utils/short-maker-name';

interface PhotoSidebarProps {
  selectedIndex: number | null;
  onSelectPhoto: (index: number) => void;
  onDeletePhoto: (index: number) => void;
  onClearAll: () => void;
  onAddPhotos: (files: File[] | FileList) => Promise<void>;
}

const PhotoSidebar: React.FC<PhotoSidebarProps> = ({ selectedIndex, onSelectPhoto, onDeletePhoto, onClearAll, onAddPhotos }) => {
  const { t } = useTranslation();
  const { photos, queuedFiles } = useStore();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (selectedIndex === null) return;
    listRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-tight text-foreground">
          {photos.length === 0 ? t('workspace.empty.title', 'Workspace') : t('workspace.photos.count', { count: photos.length, defaultValue: '{{count}} photos' })}
        </h2>
        <div className="flex items-center gap-3">
          {queuedFiles.length > 0 && <span className="text-[11px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">{t('queue.badge', { count: queuedFiles.length })}</span>}
          {photos.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium uppercase text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('toolbar.clear-all', 'Clear All')}
            </button>
          )}
        </div>
      </div>

      <div className="p-3 border-b border-border shrink-0">
        <Button variant="primary" className="w-full uppercase text-xs font-bold tracking-wide" onClick={() => pickImageFiles((files) => void onAddPhotos(files))}>
          <AddIcon size={16} />
          <span className="ml-2">{t('toolbar.add-photos', 'Add Photos')}</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {photos.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">{t('workspace.empty.description', 'Added photos will appear here.')}</p>
          </div>
        ) : (
          <ul ref={listRef} className="divide-y divide-border">
            {photos.map((photo, index) => {
              const isSelected = selectedIndex === index;
              const camera = [photo.metadata.make && getShortMakerName(photo.metadata.make), photo.metadata.model].filter(Boolean).join(' ');

              return (
                <li key={index} className={`group relative transition-colors ${isSelected ? 'bg-secondary' : 'hover:bg-muted/60'}`}>
                  <button
                    type="button"
                    onClick={() => onSelectPhoto(index)}
                    aria-current={isSelected ? 'true' : undefined}
                    className="w-full flex items-center gap-3 p-3 pr-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="w-14 h-14 shrink-0 overflow-hidden border border-border bg-muted">
                      <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate" title={photo.file.name}>
                        {photo.file.name}
                      </p>
                      {camera && <p className="mt-0.5 text-xs text-muted-foreground truncate">{camera}</p>}
                      <p className="mt-0.5 text-[11px] font-mono text-muted-foreground truncate">
                        {photo.image.naturalWidth}×{photo.image.naturalHeight} · {formatFileSize(photo.file.size)}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeletePhoto(index)}
                    title={t('photo.delete', 'Delete photo')}
                    aria-label={t('photo.delete', 'Delete photo')}
                    className="absolute right-2 top-2 p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary pointer-events-none" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PhotoSidebar;
