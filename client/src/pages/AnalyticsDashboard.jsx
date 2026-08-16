import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { formatDate } from '../utils/helpers';
import { 
  BarChart3, 
  Eye, 
  Flame, 
  MessageSquare, 
  Users, 
  CheckSquare, 
  Download, 
  TrendingUp, 
  ArrowLeft,
  FileText,
  Sparkles
} from 'lucide-react';

export default function AnalyticsDashboard({ onBack, onSelectPost }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, subsRes] = await Promise.all([
          api.getAnalytics(),
          api.getSubscribers()
        ]);
        setData(analyticsRes);
        setSubscribers(subsRes.subscribers || []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/newsletter/export', '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
        <p>Loading platform analytics and metrics...</p>
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="analytics-dashboard-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <button className="btn-ghost" onClick={onBack} style={{ marginBottom: '8px' }}>
            <ArrowLeft size={16} />
            <span>Back to Feed</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
              <BarChart3 size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.85rem' }}>Author & Platform Analytics</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Track readership, action completion rates, reactions, and subscriber growth.
              </p>
            </div>
          </div>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV}>
          <Download size={16} />
          <span>Export Subscribers (.CSV)</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="analytics-stats-grid">
        <div className="stat-metric-card">
          <div className="stat-icon-box">
            <Eye size={24} />
          </div>
          <div>
            <div className="stat-metric-value">{summary.totalViews || 0}</div>
            <div className="stat-metric-label">Total Article Reads</div>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon-box" style={{ color: 'var(--rose)', background: 'rgba(244, 63, 94, 0.12)' }}>
            <Flame size={24} />
          </div>
          <div>
            <div className="stat-metric-value">{summary.totalReactions || 0}</div>
            <div className="stat-metric-label">Claps & Reactions</div>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon-box" style={{ color: 'var(--emerald)', background: 'rgba(16, 185, 129, 0.12)' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div className="stat-metric-value">{summary.completedActionItems || 0}</div>
            <div className="stat-metric-label">Completed Action Steps</div>
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-icon-box" style={{ color: 'var(--cyan)', background: 'rgba(6, 182, 212, 0.12)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-metric-value">{summary.totalSubscribers || 0}</div>
            <div className="stat-metric-label">Action Digest Subscribers</div>
          </div>
        </div>
      </div>

      {/* Top Performing Articles Table */}
      <div className="data-table-wrapper">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-primary)" />
            <span>Top Performing Engineering Blueprints</span>
          </h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Article Title</th>
              <th>Category</th>
              <th>Views</th>
              <th>Reactions</th>
              <th>Discussions</th>
              <th>Action Tasks</th>
            </tr>
          </thead>
          <tbody>
            {data?.topPosts?.map((post) => (
              <tr 
                key={post.id} 
                onClick={() => onSelectPost(post.slug)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ fontWeight: 600 }}>{post.title}</td>
                <td>
                  <span className="badge-outline" style={{ fontSize: '0.75rem' }}>{post.category}</span>
                </td>
                <td>{post.views}</td>
                <td>{post.reactions_count}</td>
                <td>{post.comments_count}</td>
                <td>
                  <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
                    {post.action_items_count} steps
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Newsletter Subscribers Table */}
      <div className="data-table-wrapper">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--cyan)" />
            <span>Recent Newsletter Subscribers ({subscribers.length})</span>
          </h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Subscriber Email</th>
              <th>Topic Preferences</th>
              <th>Subscribed Date</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.slice(0, 10).map((sub) => (
              <tr key={sub.id}>
                <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{sub.email}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{sub.topics}</td>
                <td style={{ color: 'var(--text-muted)' }}>{formatDate(sub.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
