// Unified API client for PulseBlog

// Generate or retrieve persistent anonymous user session ID for reactions/bookmarks/actions
export function getUserSession() {
  let session = localStorage.getItem('pulse_user_session');
  if (!session) {
    session = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('pulse_user_session', session);
  }
  return session;
}

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const userSession = getUserSession();
  const headers = {
    'Content-Type': 'application/json',
    'x-user-session': userSession,
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Posts
  getPosts: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return request(`/posts${qs ? `?${qs}` : ''}`);
  },

  getFeaturedPost: () => request('/posts/featured'),

  getPostBySlug: (slug) => request(`/posts/${slug}`),

  createPost: (postData) => request('/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  }),

  updatePost: (id, postData) => request(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData)
  }),

  deletePost: (id) => request(`/posts/${id}`, {
    method: 'DELETE'
  }),

  // Actions / Interactive Checklist
  getPostActions: (postId) => request(`/actions/post/${postId}`),

  toggleActionItem: (postId, actionId, isCompleted) => request('/actions/toggle', {
    method: 'POST',
    body: JSON.stringify({ postId, actionId, isCompleted })
  }),

  // Polls
  getPostPoll: (postId) => request(`/polls/post/${postId}`),

  votePoll: (pollId, optionId) => request('/polls/vote', {
    method: 'POST',
    body: JSON.stringify({ pollId, optionId })
  }),

  // Comments
  getComments: (postId) => request(`/comments/post/${postId}`),

  createComment: (commentData) => request('/comments', {
    method: 'POST',
    body: JSON.stringify(commentData)
  }),

  upvoteComment: (commentId) => request(`/comments/${commentId}/upvote`, {
    method: 'POST'
  }),

  // Reactions
  getReactions: (postId) => request(`/reactions/post/${postId}`),

  toggleReaction: (postId, reactionType, increment = 1) => request('/reactions/toggle', {
    method: 'POST',
    body: JSON.stringify({ postId, reactionType, increment })
  }),

  // Bookmarks
  getBookmarks: () => request('/bookmarks'),

  toggleBookmark: (postId) => request('/bookmarks/toggle', {
    method: 'POST',
    body: JSON.stringify({ postId })
  }),

  // Newsletter
  subscribeNewsletter: (email, topics) => request('/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, topics })
  }),

  getSubscribers: () => request('/newsletter/subscribers'),

  // Analytics
  getAnalytics: () => request('/analytics/overview')
};
