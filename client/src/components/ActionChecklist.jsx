import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { triggerCelebration } from '../utils/helpers';
import { useToast } from './Toast';
import { 
  CheckSquare, 
  Check, 
  Copy, 
  ExternalLink, 
  Trophy, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ActionChecklist({ postId, initialActions = [] }) {
  const [actions, setActions] = useState(initialActions);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    setActions(initialActions);
  }, [initialActions]);

  const total = actions.length;
  const completedCount = actions.filter(a => a.is_completed).length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isAllDone = total > 0 && completedCount === total;

  const handleToggle = async (action) => {
    const nextState = !action.is_completed;
    setLoadingActionId(action.id);

    // Optimistic UI update
    setActions(prev => prev.map(item => 
      item.id === action.id ? { ...item, is_completed: nextState } : item
    ));

    try {
      const res = await api.toggleActionItem(postId, action.id, nextState);
      
      if (res.allCompleted) {
        triggerCelebration();
        addToast('🏆 Amazing! You completed all actionable steps in this guide!', 'success', 5000);
      } else if (nextState) {
        addToast(`Completed: Step ${action.step_number}`, 'success');
      }
    } catch (err) {
      console.error('Failed to toggle action:', err);
      // Revert on error
      setActions(prev => prev.map(item => 
        item.id === action.id ? { ...item, is_completed: !nextState } : item
      ));
      addToast('Failed to update progress', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCopySnippet = (snippet, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet);
    addToast('Code snippet copied to clipboard!', 'info');
  };

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="action-checklist-card">
      {/* Header */}
      <div className="action-checklist-header">
        <div className="action-checklist-title">
          <div style={{
            background: 'var(--accent-gradient)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <CheckSquare size={18} />
          </div>
          <div>
            <h3>Actionable Checklist</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Follow along and check off steps to apply this tutorial.
            </p>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="action-progress-wrapper">
          <div className="action-progress-bar-bg">
            <div 
              className="action-progress-bar-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="action-progress-label">
            {completedCount}/{total} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Step Items List */}
      <div className="action-items-list">
        {actions.map((action) => (
          <div 
            key={action.id} 
            className={`action-item-row ${action.is_completed ? 'completed' : ''}`}
            onClick={() => handleToggle(action)}
            style={{ cursor: 'pointer' }}
          >
            {/* Checkbox Icon */}
            <div 
              className="action-checkbox"
              aria-label={`Mark step ${action.step_number} as ${action.is_completed ? 'incomplete' : 'complete'}`}
            >
              {action.is_completed && <Check size={14} strokeWidth={3} />}
            </div>

            {/* Action Details */}
            <div className="action-item-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.75rem', 
                  color: 'var(--accent-primary)',
                  fontWeight: 700 
                }}>
                  STEP {action.step_number}
                </span>
                <span className="action-item-title">{action.title}</span>
              </div>

              {action.description && (
                <p className="action-item-desc">{action.description}</p>
              )}

              {/* Code Snippet if present */}
              {action.code_snippet && (
                <div className="action-item-snippet-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Snippet</span>
                    <button 
                      className="code-copy-btn" 
                      onClick={(e) => handleCopySnippet(action.code_snippet, e)}
                    >
                      <Copy size={12} />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{action.code_snippet}</pre>
                </div>
              )}

              {/* External resource link */}
              {action.resource_url && (
                <div style={{ marginTop: '8px' }}>
                  <a 
                    href={action.resource_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '0.8rem', 
                      color: 'var(--accent-primary)',
                      fontWeight: 600
                    }}
                  >
                    <span>View Official Reference Docs</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 100% Completion Celebration Banner */}
      {isAllDone && (
        <div className="action-complete-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--emerald)',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={20} />
            </div>
            <div>
              <h4 style={{ color: 'var(--emerald)', fontSize: '1rem' }}>Challenge Completed!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                You've successfully implemented all actionable steps in this architecture blueprint.
              </p>
            </div>
          </div>

          <button 
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '6px 14px', borderColor: 'var(--emerald)' }}
            onClick={(e) => {
              e.stopPropagation();
              triggerCelebration();
            }}
          >
            <Sparkles size={14} color="var(--emerald)" />
            <span>Celebrate Again</span>
          </button>
        </div>
      )}
    </div>
  );
}
