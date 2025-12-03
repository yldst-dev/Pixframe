import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from 'konsta/react';
import { Analytics } from '@vercel/analytics/react';
import Router from './router';

import './index.css';
import './locales';
import './fonts';
import './update-latest-version';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App theme="ios" safeAreas>
      <Router />
      <Analytics />
    </App>
  </React.StrictMode>
);
