import type { BookmarksListResponse } from '../../shared/apiTypes';
import { apiFetch } from './client';

export function loadBookmarks(token: string): Promise<BookmarksListResponse> {
  return apiFetch<BookmarksListResponse>('/api/bookmarks', {
    method: 'GET',
    token,
  });
}
