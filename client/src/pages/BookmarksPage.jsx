import React from 'react';
import { useBookmarks } from '../context/BookmarksContext';
import PostCard from '../components/PostCard';
import { Bookmark, Sparkles, ArrowLeft } from 'lucide-react';

export default function BookmarksPage({ onSelectPost, onBack }) {
  const { bookmarks, loading, refreshBookmarks } = useBookmarks();

  return (
    <div className="bookmarks-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <button className="btn-ghost" onClick={onBack} style={{ marginBottom: '8px' }}>
            <ArrowLeft size={16} />
            <span>Back to Feed</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
              <Bookmark size={18} fill="currentColor" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem' }}>Reading List & Action Queue</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Articles and blueprints you have saved to learn and execute later.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <p>Loading your saved articles...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px', margin: '20px 0' }}>
          <Bookmark size={40} color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
          <h3>Your Reading List is Empty</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '10px auto 24px' }}>
            Click the bookmark icon on any article card or post to save it here for offline reference and tracking.
          </p>
          <button className="btn-primary" onClick={onBack}>
            Explore Articles
          </button>
        </div>
      ) : (
        <div className="posts-grid">
          {bookmarks.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onSelectPost={onSelectPost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
