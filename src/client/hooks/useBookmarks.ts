import { useCallback, useEffect, useRef, useState } from 'react';
import { loadBookmarks } from '../api/bookmarks';
import type { BookmarkDto } from '../../shared/apiTypes';

export interface UseBookmarksState {
  bookmarks: BookmarkDto[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  reload: () => void;
  reset: () => void;
}

export function useBookmarks(token: string | null): UseBookmarksState {
  const [bookmarks, setBookmarks] = useState<BookmarkDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setBookmarks([]);
    setIsLoading(false);
    setIsLoaded(false);
    setError(null);
  }, []);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!token) {
      reset();
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    loadBookmarks(token)
      .then((response) => {
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }

        setBookmarks(response.bookmarks);
        setIsLoaded(true);
      })
      .catch((cause: unknown) => {
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }

        setBookmarks([]);
        setIsLoaded(false);
        setError(cause instanceof Error ? cause.message : 'Unable to load bookmarks.');
      })
      .finally(() => {
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, reset, token]);

  return {
    bookmarks,
    isLoading,
    isLoaded,
    error,
    reload,
    reset,
  };
}
