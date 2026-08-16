import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeFeed from './pages/HomeFeed';
import PostDetail from './pages/PostDetail';
import EditorStudio from './pages/EditorStudio';
import BookmarksPage from './pages/BookmarksPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    // Check url hash for initial routing
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('post/')) {
      return { page: 'post-detail', slug: hash.replace('post/', '') };
    }
    if (hash === 'editor') return { page: 'editor' };
    if (hash === 'bookmarks') return { page: 'bookmarks' };
    if (hash === 'analytics') return { page: 'analytics' };
    return { page: 'home' };
  });

  const [readingProgress, setReadingProgress] = useState(0);

  // Sync state changes with URL hash
  const navigate = (view) => {
    setCurrentView(view);
    setReadingProgress(0);

    if (view.page === 'home') {
      window.location.hash = '';
    } else if (view.page === 'post-detail' && view.slug) {
      window.location.hash = `post/${view.slug}`;
    } else {
      window.location.hash = view.page;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('post/')) {
        setCurrentView({ page: 'post-detail', slug: hash.replace('post/', '') });
      } else if (hash === 'editor') {
        setCurrentView({ page: 'editor' });
      } else if (hash === 'bookmarks') {
        setCurrentView({ page: 'bookmarks' });
      } else if (hash === 'analytics') {
        setCurrentView({ page: 'analytics' });
      } else {
        setCurrentView({ page: 'home' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="app-container">
      {/* Navbar with reading progress */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={navigate} 
        readingProgress={readingProgress}
        isArticlePage={currentView.page === 'post-detail'}
      />

      {/* Main View Area */}
      <main className={`main-content ${currentView.page === 'editor' ? 'wide' : ''}`}>
        {currentView.page === 'home' && (
          <HomeFeed 
            onSelectPost={(slug) => navigate({ page: 'post-detail', slug })}
          />
        )}

        {currentView.page === 'post-detail' && (
          <PostDetail
            slug={currentView.slug}
            onBack={() => navigate({ page: 'home' })}
            onSelectPost={(slug) => navigate({ page: 'post-detail', slug })}
            onProgressUpdate={setReadingProgress}
          />
        )}

        {currentView.page === 'editor' && (
          <EditorStudio 
            onPostCreated={(slug) => navigate({ page: 'post-detail', slug })}
          />
        )}

        {currentView.page === 'bookmarks' && (
          <BookmarksPage 
            onSelectPost={(slug) => navigate({ page: 'post-detail', slug })}
            onBack={() => navigate({ page: 'home' })}
          />
        )}

        {currentView.page === 'analytics' && (
          <AnalyticsDashboard 
            onBack={() => navigate({ page: 'home' })}
            onSelectPost={(slug) => navigate({ page: 'post-detail', slug })}
          />
        )}
      </main>

      {/* Footer with Newsletter */}
      <Footer onNavigate={navigate} />
    </div>
  );
}
