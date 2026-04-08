import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

const mountNode =
  document.getElementById('app') ??
  document.getElementById('root') ??
  (() => {
    const node = document.createElement('div');
    node.id = 'app';
    document.body.appendChild(node);
    return node;
  })();

ReactDOM.createRoot(mountNode).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
