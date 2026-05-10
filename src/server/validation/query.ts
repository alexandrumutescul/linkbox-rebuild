import { ValidationError } from './bookmarks.js';

export interface BookmarkListQuery {
  searchText?: string;
  tag?: string;
}

function parseOptionalSingleString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ValidationError([`${fieldName} must be a single string`]);
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function parseBookmarkListQuery(query: Record<string, unknown>): BookmarkListQuery {
  return {
    searchText: parseOptionalSingleString(query.q, 'q'),
    tag: parseOptionalSingleString(query.tag, 'tag')?.toLowerCase(),
  };
}
