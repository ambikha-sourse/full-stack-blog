import React, { useState } from 'react';
import { api } from '../utils/api';
import { useToast } from './Toast';

const REACTION_CONFIG = [
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'insight', emoji: '💡', label: 'Insightful' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'rocket', emoji: '🚀', label: 'Inspiring' }
];

export default function ReactionBar({ postId, initialReactions = {}, userReactions = [] }) {
  const [reactions, setReactions] = useState(initialReactions);
  const [reactedTypes, setReactedTypes] = useState(new Set(userReactions));
  const { addToast } = useToast();

  const handleReact = async (type) => {
    // Optimistic bump
    setReactions(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    setReactedTypes(prev => new Set(prev).add(type));

    try {
      const res = await api.toggleReaction(postId, type, 1);
      if (res.totals) {
        setReactions(res.totals);
      }
      addToast(`Added ${type} reaction!`, 'info');
    } catch (err) {
      console.error('Failed to submit reaction:', err);
    }
  };

  return (
    <div className="reaction-bar">
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '8px' }}>
        React to this article:
      </span>
      {REACTION_CONFIG.map(({ type, emoji, label }) => {
        const count = reactions[type] || 0;
        const hasReacted = reactedTypes.has(type);

        return (
          <button
            key={type}
            className={`reaction-btn ${hasReacted ? 'reacted' : ''}`}
            onClick={() => handleReact(type)}
            title={`React with ${label}`}
          >
            <span style={{ fontSize: '1.15rem' }}>{emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
