import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router')) return 'router';
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('jszip')) return 'zip';
          if (id.includes('exifreader') || id.includes('heic2any')) return 'image-tools';
          if (id.includes('konsta')) return 'konsta';

          return 'vendor';
        },
      },
    },
  },
});
