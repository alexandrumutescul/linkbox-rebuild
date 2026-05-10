import type { BookmarkResponse, BookmarksListResponse, CreateBookmarkRequest, PatchBookmarkRequest } from '../../shared/apiTypes';
import { apiFetch } from './client';

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export function listBookmarks(token: string): Promise<BookmarksListResponse> {
  return apiFetch<BookmarksListResponse>('/api/bookmarks', {
    method: 'GET',
    token,
  });
}

export const loadBookmarks = listBookmarks;

export function createBookmark(token: string, bookmark: CreateBookmarkRequest): Promise<BookmarkResponse> {
  return apiFetch<BookmarkResponse>('/api/bookmarks', {
    method: 'POST',
    token,
    headers: jsonHeaders(),
    body: JSON.stringify(bookmark),
  });
}

export function updateBookmark(token: string, id: number, bookmark: PatchBookmarkRequest): Promise<BookmarkResponse> {
  return apiFetch<BookmarkResponse>(`/api/bookmarks/${id}`, {
    method: 'PATCH',
    token,
    headers: jsonHeaders(),
    body: JSON.stringify(bookmark),
  });
}

export function deleteBookmark(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/bookmarks/${id}`, {
    method: 'DELETE',
    token,
  });
}
