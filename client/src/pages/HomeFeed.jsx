import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import PostCard from '../components/PostCard';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Clock,
  Flame,
  CheckSquare
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Engineering & Architecture',
  'AI & Machine Learning',
  'UI/UX & Design',
  'Productivity & DevOps'
];

export default function HomeFeed({ onSelectPost }) {
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getPosts({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        sort: sortBy
      });
      setPosts(data.posts || []);

      // If category is All and no search, load featured post
      if (selectedCategory === 'All' && !searchQuery) {
        const feat = await api.getFeaturedPost().catch(() => null);
        setFeaturedPost(feat);
      } else {
        setFeaturedPost(null);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="home-feed-view">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge-container">
          <span className="badge-gradient">
            <Sparkles size={13} />
            The Actionable Tech Hub
          </span>
        </div>
        <h1 className="hero-title">
          Engineering Insights You Can <span className="gradient-text">Actually Execute</span>
        </h1>
        <p className="hero-subtitle">
          In-depth architectural guides, real code blueprints, and interactive progress checklists built for modern engineers and builders.
        </p>

        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input
            type="text"
            className="search-input"
            placeholder="Search articles, architecture patterns, tools, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="search-clear-btn" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </section>

      {/* Category Pills Filter */}
      <div className="category-pills" style={{ marginBottom: '36px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Post Spotlight (When on All and no search) */}
      {featuredPost && (
        <div 
          className="featured-card"
          onClick={() => onSelectPost(featuredPost.slug)}
          style={{ cursor: 'pointer' }}
        >
          <div className="featured-image-box">
            <img src={featuredPost.cover_image} alt={featuredPost.title} />
          </div>
          <div className="featured-content">
            <div>
              <div className="featured-header">
                <span className="badge-gradient">Featured Blueprint</span>
                <span className="badge-outline">{featuredPost.category}</span>
              </div>
              <h2 className="featured-title">{featuredPost.title}</h2>
              <p className="featured-subtitle">{featuredPost.subtitle}</p>

              {featuredPost.total_action_items > 0 && (
                <div className="post-action-metric" style={{ maxWidth: '280px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={16} />
                    <span>Includes Action Checklist</span>
                  </div>
                  <span>{featuredPost.total_action_items} Steps</span>
                </div>
              )}
            </div>

            <div className="featured-footer">
              <div className="author-info">
                <img src={featuredPost.author_avatar} alt={featuredPost.author_name} className="author-avatar" />
                <div>
                  <div className="author-name">{featuredPost.author_name}</div>
                  <div className="author-role">{featuredPost.author_role}</div>
                </div>
              </div>

              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <span>Read Blueprint</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Toolbar (Sorting + Grid/List Toggles) */}
      <div className="feed-toolbar">
        <div className="feed-stats">
          Showing <strong>{posts.length}</strong> {posts.length === 1 ? 'article' : 'articles'}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </div>

        <div className="feed-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={15} color="var(--text-muted)" />
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">Latest First</option>
              <option value="popular">Most Viewed</option>
              <option value="trending">Most Clapped</option>
              <option value="actionable">Most Actionable</option>
            </select>
          </div>

          <div className="view-toggle-btns">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <p>Loading actionable articles...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px', margin: '20px 0' }}>
          <Sparkles size={36} color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
          <h3>No articles found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '420px', margin: '8px auto 20px' }}>
            No articles match your current search query or category filter. Try clearing filters or exploring other topics.
          </p>
          <button 
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className={`posts-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onSelectPost={onSelectPost} 
              isCompact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
