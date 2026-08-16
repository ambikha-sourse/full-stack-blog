import React from 'react';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from './Toast';
import { formatDate } from '../utils/helpers';
import { 
  Bookmark, 
  Clock, 
  Eye, 
  MessageSquare, 
  Flame, 
  CheckSquare,
  Sparkles
} from 'lucide-react';

export default function PostCard({ post, onSelectPost, isCompact = false }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToast } = useToast();
  const saved = isBookmarked(post.id);

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    const result = await toggleBookmark(post.id);
    addToast(result ? 'Added to Reading List!' : 'Removed from Reading List', 'info');
  };

  return (
    <article 
      className="post-card"
      onClick={() => onSelectPost(post.slug)}
      style={{ cursor: 'pointer' }}
    >
      {/* Thumbnail */}
      <div className="post-card-thumb">
        <img 
          src={post.cover_image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'} 
          alt={post.title} 
          loading="lazy"
        />
        <div className="post-card-category-badge">
          {post.category}
        </div>
        <button
          className={`post-bookmark-btn ${saved ? 'active' : ''}`}
          onClick={handleBookmarkClick}
          title={saved ? 'Remove bookmark' : 'Bookmark post'}
          aria-label="Save for later"
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Card Body */}
      <div className="post-card-body">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="post-card-tags">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="post-tag">#{tag}</span>
            ))}
          </div>
        )}

        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-subtitle">{post.subtitle || post.content?.substring(0, 110)}...</p>

        {/* Actionable Feature Callout */}
        {post.total_action_items > 0 && (
          <div className="post-action-metric">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={16} color="var(--accent-primary)" />
              <span>Interactive Checklist</span>
            </div>
            <span style={{ 
              background: 'var(--accent-primary)', 
              color: '#fff', 
              fontSize: '0.75rem', 
              padding: '2px 8px', 
              borderRadius: 'var(--radius-full)' 
            }}>
              {post.total_action_items} Steps
            </span>
          </div>
        )}

        {/* Card Footer */}
        <div className="post-card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={post.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} 
              alt={post.author_name} 
              className="author-avatar"
              style={{ width: '26px', height: '26px' }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.author_name}</span>
          </div>

          <div className="post-card-stats">
            <span className="stat-item" title="Estimated read time">
              <Clock size={14} />
              {post.read_time_minutes}m
            </span>
            <span className="stat-item" title="Views">
              <Eye size={14} />
              {post.views || 0}
            </span>
            <span className="stat-item" title="Reactions">
              <Flame size={14} color="var(--rose)" />
              {post.total_reactions || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
