import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from 'konsta/react';
import { Analytics } from '@vercel/analytics/react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import Router from './router';
import ToastHost from './components/ui/toast-host';
import { initializeSafeStorage } from './utils/safe-storage';

import './index.css';
import './fonts';
import './update-latest-version';

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App theme="ios" safeAreas>
        <Router />
        <ToastHost />
        <Analytics />
      </App>
    </React.StrictMode>
  );
};

const bootstrap = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add('native-app');
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Light });
    } else {
      document.body.classList.remove('native-app');
    }
    await initializeSafeStorage();
    await import('./locales');
  } catch (error) {
    console.error('Failed to initialize safe storage', error);
    await import('./locales');
  }
  renderApp();
};

void bootstrap();
