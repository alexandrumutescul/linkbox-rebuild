export interface BookmarkDto {
  id: number;
  url: string;
  title: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookmarkRequest {
  url: string;
  title: string;
  notes?: string | null;
  tags?: string[];
}

export interface PatchBookmarkRequest {
  url?: string;
  title?: string;
  notes?: string | null;
  tags?: string[];
}

export interface BookmarkResponse {
  bookmark: BookmarkDto;
}

export interface BookmarksListResponse {
  bookmarks: BookmarkDto[];
}

export interface TagListItemDto {
  name: string;
  bookmarkCount: number;
}

export interface TagsListResponse {
  tags: TagListItemDto[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}
