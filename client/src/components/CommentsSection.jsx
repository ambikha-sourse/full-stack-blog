import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { formatDate } from '../utils/helpers';
import { useToast } from './Toast';
import { MessageSquare, ThumbsUp, Reply, Send, CornerDownRight } from 'lucide-react';

export default function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('pulse_author_name') || '');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchComments = async () => {
    try {
      const data = await api.getComments(postId);
      setComments(data.comments || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handlePostComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newComment;
    const name = authorName.trim() || 'Software Engineer';

    if (!content.trim()) {
      addToast('Please write a comment first', 'error');
      return;
    }

    try {
      setSubmitting(true);
      localStorage.setItem('pulse_author_name', name);

      await api.createComment({
        postId,
        parentId,
        authorName: name,
        content: content.trim()
      });

      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewComment('');
      }

      addToast('Comment posted successfully!', 'success');
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
      addToast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (commentId) => {
    try {
      const res = await api.upvoteComment(commentId);
      // Update in state
      const updateTree = (list) => list.map(c => {
        if (c.id === commentId) {
          return { ...c, upvotes: res.upvotes };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateTree(c.replies) };
        }
        return c;
      });

      setComments(updateTree(comments));
      addToast('Upvoted comment!', 'info');
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className="comment-card" style={isReply ? { background: 'var(--bg-tertiary)' } : {}}>
      <div className="comment-card-header">
        <div className="comment-user">
          <img 
            src={comment.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(comment.author_name)}`} 
            alt={comment.author_name} 
            className="comment-avatar"
          />
          <div>
            <span className="comment-author-name">{comment.author_name}</span>
            <div className="comment-date">{formatDate(comment.created_at)}</div>
          </div>
        </div>

        <button 
          className="comment-upvote-btn"
          onClick={() => handleUpvote(comment.id)}
          title="Upvote discussion"
        >
          <ThumbsUp size={13} />
          <span>{comment.upvotes || 0}</span>
        </button>
      </div>

      <p className="comment-body">{comment.content}</p>

      <div className="comment-card-footer">
        {!isReply && (
          <button 
            className="btn-ghost" 
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
          >
            <Reply size={13} />
            <span>Reply</span>
          </button>
        )}
      </div>

      {/* Reply Input Box */}
      {replyingToId === comment.id && (
        <form 
          onSubmit={(e) => handlePostComment(e, comment.id)}
          style={{ marginTop: '14px', paddingLeft: '14px', borderLeft: '2px solid var(--accent-primary)' }}
        >
          <textarea
            className="comment-textarea"
            style={{ minHeight: '60px', fontSize: '0.85rem' }}
            placeholder={`Reply to ${comment.author_name}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              type="button" 
              className="btn-ghost" 
              style={{ fontSize: '0.8rem' }}
              onClick={() => setReplyingToId(null)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              disabled={submitting}
            >
              <Send size={12} />
              <span>Send Reply</span>
            </button>
          </div>
        </form>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies-list">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <section className="comments-section">
      <div className="comments-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={22} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.4rem' }}>Discussion ({totalCount})</h3>
        </div>
      </div>

      {/* Top Comment Input Box */}
      <form className="comment-input-card" onSubmit={(e) => handlePostComment(e, null)}>
        <textarea
          className="comment-textarea"
          placeholder="Share your thoughts, ask technical questions, or discuss implementation details..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          required
        />
        <div className="comment-form-footer">
          <input
            type="text"
            className="comment-author-input"
            placeholder="Your Name (e.g. Maya Lin)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting}
          >
            <Send size={15} />
            <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>

      {/* Comment List */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading discussions...</p>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
          <p>No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="comments-tree">
          {comments.map(c => renderComment(c, false))}
        </div>
      )}
    </section>
  );
}
