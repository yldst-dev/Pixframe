// Legacy store - now imports from the new modular stores
// This file provides backward compatibility for existing code

export { useStore } from './stores';
export type { Store } from './types';

// Export individual stores for specific use cases
export { useUIStore, usePhotoStore, useSettingsStore } from './stores';
