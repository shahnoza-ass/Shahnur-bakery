import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { InstallApp } from './components/common/InstallApp';
import './styles/index.css';
import './styles/shahnur.css';
import './styles/commerce.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <InstallApp />
  </React.StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(error => console.warn('PWA registration failed', error));
  });
}
