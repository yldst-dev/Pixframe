import { useUIStore } from './ui-store';
import { usePhotoStore } from './photo-store';
import { useSettingsStore } from './settings-store';
import { Store } from '../types';

/**
 * Combined store hook for backward compatibility
 * Merges all individual stores into a single interface
 */
export const useStore = (): Store => {
  const uiStore = useUIStore();
  const photoStore = usePhotoStore();
  const settingsStore = useSettingsStore();

  return {
    ...uiStore,
    ...photoStore,
    ...settingsStore,
  };
};

// Export individual stores for direct access when needed
export { useUIStore } from './ui-store';
export { usePhotoStore } from './photo-store';
export { useSettingsStore } from './settings-store';

// Export types
export type { UIStore } from './ui-store';
export type { PhotoStore } from './photo-store';
export type { SettingsStore } from './settings-store';