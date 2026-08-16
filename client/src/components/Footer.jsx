import React, { useState } from 'react';
import { Zap, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from './Toast';

export default function Footer({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      addToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.subscribeNewsletter(email, 'Engineering & Architecture, AI & ML, Full-Stack');
      addToast(res.message || 'Subscribed successfully!', 'success');
      setEmail('');
    } catch (err) {
      addToast(err.message || 'Failed to subscribe', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Newsletter Callout */}
        <div className="newsletter-box">
          <span className="badge-gradient" style={{ marginBottom: '16px' }}>Weekly Action Digest</span>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>
            Level Up Your Engineering Craft
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
            Receive actionable architecture blueprints, interactive code challenges, and tech insights delivered every Tuesday. Zero fluff.
          </p>

          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your work email (e.g. dev@company.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="editor-input"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-full)',
                padding: '14px 20px',
                flex: 1
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ borderRadius: 'var(--radius-full)', padding: '14px 28px' }}
            >
              {loading ? 'Subscribing...' : (
                <>
                  <span>Join Digest</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Bottom */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          paddingTop: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-icon" style={{ width: '26px', height: '26px' }}>
              <Zap size={14} fill="currentColor" />
            </div>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              PulseBlog © {new Date().getFullYear()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
            <button onClick={() => onNavigate && onNavigate({ page: 'home' })} className="btn-ghost" style={{ padding: 0 }}>Articles</button>
            <button onClick={() => onNavigate && onNavigate({ page: 'bookmarks' })} className="btn-ghost" style={{ padding: 0 }}>Reading List</button>
            <button onClick={() => onNavigate && onNavigate({ page: 'analytics' })} className="btn-ghost" style={{ padding: 0 }}>Author Metrics</button>
            <button onClick={() => onNavigate && onNavigate({ page: 'editor' })} className="btn-ghost" style={{ padding: 0 }}>Create Post</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
