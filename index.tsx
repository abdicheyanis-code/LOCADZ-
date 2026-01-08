import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './components/NotificationProvider';
import { BrowserRouter } from 'react-router-dom';

// Désactivation du service worker pour éviter les problèmes de cache
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        reg.unregister();
      });
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
