import type { BookmarkDto } from '../../shared/apiTypes.js';

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type PersistedBookmark = Bookmark;

export interface CreateBookmarkInput {
  url: string;
  title: string;
  notes: string | null;
  tags: string[];
}

export interface PatchBookmarkInput {
  url?: string;
  title?: string;
  notes?: string | null;
  tags?: string[];
}

export function toBookmarkDto(bookmark: Bookmark): BookmarkDto {
  return bookmark;
}
