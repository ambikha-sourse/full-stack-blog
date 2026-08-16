import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useBookmarks } from '../context/BookmarksContext';
import { 
  Zap, 
  Bookmark, 
  PenSquare, 
  BarChart3, 
  Sun, 
  Moon, 
  Sparkles,
  BookOpen,
  CheckSquare
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, readingProgress = 0, isArticlePage = false }) {
  const { theme, toggleTheme } = useTheme();
  const { bookmarkCount } = useBookmarks();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="navbar-wrapper" style={{
      borderBottomColor: scrolled ? 'var(--border-focus)' : 'var(--border-color)',
      boxShadow: scrolled ? 'var(--shadow-md)' : 'none'
    }}>
      <div className="navbar-container">
        {/* Brand */}
        <div 
          className="brand-logo" 
          onClick={() => setCurrentView({ page: 'home' })}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-icon">
            <Zap size={18} fill="currentColor" />
          </div>
          <span>Pulse<span style={{ color: 'var(--accent-primary)' }}>Blog</span></span>
          <span className="badge-gradient" style={{ fontSize: '0.65rem', padding: '2px 8px', marginLeft: '6px' }}>
            Actionable
          </span>
        </div>

        {/* Navigation links */}
        <nav className="nav-links">
          <button 
            className={`nav-link-item ${currentView.page === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentView({ page: 'home' })}
          >
            <BookOpen size={16} />
            <span>Articles</span>
          </button>

          <button 
            className={`nav-link-item ${currentView.page === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setCurrentView({ page: 'bookmarks' })}
          >
            <Bookmark size={16} />
            <span>Reading List</span>
            {bookmarkCount > 0 && (
              <span style={{
                background: 'var(--accent-primary)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {bookmarkCount}
              </span>
            )}
          </button>

          <button 
            className={`nav-link-item ${currentView.page === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView({ page: 'analytics' })}
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* Write / Author Studio Button */}
          <button 
            className="btn-primary"
            onClick={() => setCurrentView({ page: 'editor' })}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <PenSquare size={16} />
            <span>Studio</span>
          </button>

          {/* Theme Switcher */}
          <button 
            className="btn-icon" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Reading Progress Indicator for Article View */}
      {isArticlePage && (
        <div 
          className="reading-progress-bar"
          style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
        />
      )}
    </header>
  );
}
