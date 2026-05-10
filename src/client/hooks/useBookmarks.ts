import { useCallback, useEffect, useRef, useState } from 'react';
import { createBookmark, deleteBookmark, listBookmarks, updateBookmark } from '../api/bookmarks';
import type { BookmarkDto, CreateBookmarkRequest, PatchBookmarkRequest } from '../../shared/apiTypes';

export interface UseBookmarksState {
  bookmarks: BookmarkDto[];
  isLoading: boolean;
  isLoaded: boolean;
  isMutating: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
  reset: () => void;
  create: (bookmark: CreateBookmarkRequest) => Promise<BookmarkDto>;
  update: (id: number, bookmark: PatchBookmarkRequest) => Promise<BookmarkDto>;
  delete: (id: number) => Promise<void>;
}

function messageFromError(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

export function useBookmarks(token: string | null): UseBookmarksState {
  const [bookmarks, setBookmarks] = useState<BookmarkDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setBookmarks([]);
    setIsLoading(false);
    setIsLoaded(false);
    setIsMutating(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      reset();
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await listBookmarks(token);
      if (requestIdRef.current !== requestId) {
        return;
      }
      setBookmarks(response.bookmarks);
      setIsLoaded(true);
    } catch (cause: unknown) {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setBookmarks([]);
      setIsLoaded(false);
      setError(messageFromError(cause, 'Unable to load bookmarks.'));
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [reset, token]);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, reloadKey]);

  const create = useCallback(
    async (bookmark: CreateBookmarkRequest) => {
      if (!token) {
        throw new Error('An API token is required.');
      }

      setIsMutating(true);
      try {
        const response = await createBookmark(token, bookmark);
        await refresh();
        return response.bookmark;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh, token],
  );

  const update = useCallback(
    async (id: number, bookmark: PatchBookmarkRequest) => {
      if (!token) {
        throw new Error('An API token is required.');
      }

      setIsMutating(true);
      try {
        const response = await updateBookmark(token, id, bookmark);
        await refresh();
        return response.bookmark;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh, token],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!token) {
        throw new Error('An API token is required.');
      }

      setIsMutating(true);
      try {
        await deleteBookmark(token, id);
        await refresh();
      } finally {
        setIsMutating(false);
      }
    },
    [refresh, token],
  );

  return {
    bookmarks,
    isLoading,
    isLoaded,
    isMutating,
    error,
    reload,
    refresh,
    reset,
    create,
    update,
    delete: remove,
  };
}
