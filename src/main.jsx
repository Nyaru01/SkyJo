import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// @ts-ignore - Defined by Vite during build
/* global __APP_VERSION__ */
const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App version={version} />
  </React.StrictMode>,
);
