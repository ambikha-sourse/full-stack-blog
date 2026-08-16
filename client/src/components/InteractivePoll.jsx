import React, { useState } from 'react';
import { api } from '../utils/api';
import { useToast } from './Toast';
import { HelpCircle, Check, BarChart2 } from 'lucide-react';

export default function InteractivePoll({ initialPoll }) {
  const [poll, setPoll] = useState(initialPoll);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  if (!poll || !poll.options || poll.options.length === 0) {
    return null;
  }

  const handleVote = async (optionId) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await api.votePoll(poll.id, optionId);
      if (res.success) {
        setPoll(res.poll);
        addToast('Your vote has been recorded!', 'success');
      }
    } catch (err) {
      console.error('Failed to submit vote:', err);
      addToast('Failed to record vote', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="poll-card">
      <div className="poll-question">
        <HelpCircle size={20} color="var(--accent-primary)" />
        <span>{poll.question}</span>
      </div>

      <div className="poll-options-list">
        {poll.options.map((option) => {
          const isUserVoted = poll.userVotedOptionId === option.id;

          return (
            <button
              key={option.id}
              className={`poll-option-btn ${isUserVoted ? 'selected' : ''}`}
              onClick={() => handleVote(option.id)}
              disabled={isSubmitting}
            >
              {/* Fill bar for percentage */}
              <div 
                className="poll-fill-bar" 
                style={{ 
                  width: `${option.percentage || 0}%`,
                  background: isUserVoted ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.15)'
                }}
              />

              {/* Text & Checkmark */}
              <div className="poll-option-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isUserVoted && <Check size={16} color="var(--accent-primary)" strokeWidth={3} />}
                <span>{option.option_text}</span>
              </div>

              {/* Percentage & Vote Count */}
              <div className="poll-option-pct">
                <span>{option.percentage || 0}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({option.votes_count || 0})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="poll-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={14} />
          <span>{poll.totalVotes} total reader votes</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {poll.hasVoted ? '✓ You participated in this poll' : 'Click any option to vote instantly'}
        </span>
      </div>
    </div>
  );
}
