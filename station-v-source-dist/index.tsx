
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';

// Define types for Vite's import.meta.env
interface ImportMetaEnv {
  VITE_GEMINI_API_KEY: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
