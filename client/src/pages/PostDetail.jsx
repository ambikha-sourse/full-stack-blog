import React, { useEffect, useState, useRef } from 'react';
import { api } from '../utils/api';
import { renderMarkdown, extractHeadings, formatDate } from '../utils/helpers';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from '../components/Toast';
import AudioPlayer from '../components/AudioPlayer';
import ActionChecklist from '../components/ActionChecklist';
import InteractivePoll from '../components/InteractivePoll';
import TableOfContents from '../components/TableOfContents';
import ReactionBar from '../components/ReactionBar';
import CommentsSection from '../components/CommentsSection';
import { 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  Clock, 
  Eye, 
  Calendar, 
  Sparkles,
  CheckCircle,
  Tag
} from 'lucide-react';

export default function PostDetail({ slug, onBack, onSelectPost, onProgressUpdate }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState([]);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToast } = useToast();
  const contentRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await api.getPostBySlug(slug);
        setPost(data);
        setHeadings(extractHeadings(data.content));
      } catch (err) {
        console.error('Failed to load article:', err);
        addToast('Failed to load article', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug]);

  // Hook up copy buttons inside rendered markdown code blocks
  useEffect(() => {
    if (!contentRef.current) return;

    const copyButtons = contentRef.current.querySelectorAll('.code-copy-btn');
    const handlers = [];

    copyButtons.forEach((btn) => {
      const code = decodeURIComponent(btn.getAttribute('data-code') || '');
      const handler = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        addToast('Code copied to clipboard!', 'info');
      };
      btn.addEventListener('click', handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler));
    };
  }, [post]);

  // Track scroll reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        if (onProgressUpdate) onProgressUpdate(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onProgressUpdate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <p>Loading actionable article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px', margin: '40px 0' }}>
        <h3>Article not found</h3>
        <button className="btn-primary" onClick={onBack} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Articles</span>
        </button>
      </div>
    );
  }

  const saved = isBookmarked(post.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.subtitle,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Article link copied to clipboard!', 'info');
    }
  };

  const handleBookmarkToggle = async () => {
    const res = await toggleBookmark(post.id);
    addToast(res ? 'Saved to Reading List!' : 'Removed from Reading List', 'info');
  };

  return (
    <div className="article-view-page">
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <button className="btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className={`btn-secondary ${saved ? 'active' : ''}`} 
            onClick={handleBookmarkToggle}
            style={saved ? { background: 'rgba(99, 102, 241, 0.15)', borderColor: 'var(--accent-primary)' } : {}}
          >
            <Bookmark size={16} fill={saved ? 'var(--accent-primary)' : 'none'} color={saved ? 'var(--accent-primary)' : 'currentColor'} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          <button className="btn-icon" onClick={handleShare} title="Share article">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="article-layout">
        {/* Left / Center Column: Article Body */}
        <article className="article-main">
          {/* Header */}
          <header className="article-header">
            <div className="article-category-badge">
              <span className="badge-gradient">{post.category}</span>
              <span className="badge-outline" style={{ marginLeft: '8px' }}>{post.difficulty} Level</span>
            </div>

            <h1 className="article-title">{post.title}</h1>
            {post.subtitle && <p className="article-subtitle">{post.subtitle}</p>}

            <div className="article-meta-row">
              <div className="author-info">
                <img src={post.author_avatar} alt={post.author_name} className="author-avatar" />
                <div>
                  <div className="author-name">{post.author_name}</div>
                  <div className="author-role">{post.author_role}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} />
                  {formatDate(post.created_at)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  {post.read_time_minutes} min read
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={14} />
                  {post.views} views
                </span>
              </div>
            </div>

            {/* Featured Image */}
            {post.cover_image && (
              <div className="article-featured-img-box">
                <img src={post.cover_image} alt={post.title} />
              </div>
            )}

            {/* Audio Reader Player */}
            <AudioPlayer title={post.title} content={post.content} />
          </header>

          {/* Rendered Markdown Body */}
          <div 
            ref={contentRef}
            className="article-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />

          {/* Interactive Action Checklist */}
          {post.actionItems && post.actionItems.length > 0 && (
            <ActionChecklist 
              postId={post.id} 
              initialActions={post.actionItems} 
            />
          )}

          {/* Interactive Poll */}
          {post.poll && (
            <InteractivePoll 
              initialPoll={post.poll} 
            />
          )}

          {/* Reactions Bar */}
          <ReactionBar 
            postId={post.id} 
            initialReactions={post.reactions}
            userReactions={post.userReactions}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '24px 0' }}>
              <Tag size={15} color="var(--text-muted)" />
              {post.tags.map((t, idx) => (
                <span key={idx} className="badge-outline">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Discussion Thread */}
          <CommentsSection postId={post.id} />
        </article>

        {/* Right Sticky Sidebar */}
        <aside className="article-sidebar">
          {/* Table of Contents */}
          <TableOfContents headings={headings} />

          {/* Quick Action Card */}
          <div className="sidebar-card">
            <h4 className="sidebar-card-title">
              <Sparkles size={18} color="var(--accent-primary)" />
              <span>Action Summary</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Action Checklist:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {post.actionItems?.length || 0} Practical Steps
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Target Level:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{post.difficulty}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Time:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{post.read_time_minutes} Minutes</strong>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="sidebar-card">
              <h4 className="sidebar-card-title">
                <span>Related Blueprints</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {post.relatedPosts.map(rel => (
                  <div 
                    key={rel.id}
                    onClick={() => onSelectPost(rel.slug)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '2px' }}>
                      {rel.category}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                      {rel.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
