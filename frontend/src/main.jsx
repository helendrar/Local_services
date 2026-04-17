import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,.12)',
        },
        success: { iconTheme: { primary: '#1a6b4a', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>
);
