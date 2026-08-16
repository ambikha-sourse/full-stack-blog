import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../utils/api';

const BookmarksContext = createContext();

export function BookmarksProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBookmarks();
      setBookmarks(data.bookmarks || []);
      setBookmarkIds(new Set((data.bookmarks || []).map(b => b.id)));
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = async (postId) => {
    try {
      const res = await api.toggleBookmark(postId);
      setBookmarkIds(prev => {
        const next = new Set(prev);
        if (res.isBookmarked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      // Refresh full list
      fetchBookmarks();
      return res.isBookmarked;
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      return false;
    }
  };

  const isBookmarked = (postId) => bookmarkIds.has(Number(postId)) || bookmarkIds.has(postId);

  return (
    <BookmarksContext.Provider value={{ bookmarks, bookmarkCount: bookmarkIds.size, isBookmarked, toggleBookmark, refreshBookmarks: fetchBookmarks, loading }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
