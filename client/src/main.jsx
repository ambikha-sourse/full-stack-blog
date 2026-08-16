import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { BookmarksProvider } from './context/BookmarksContext';
import { ToastProvider } from './components/Toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BookmarksProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BookmarksProvider>
    </ThemeProvider>
  </React.StrictMode>
);
