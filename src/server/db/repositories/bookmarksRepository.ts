import type { Statement } from 'better-sqlite3';
import type { LinkboxDatabase } from '../connection.js';

export interface BookmarkRow {
  id: number;
  url: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BookmarkDbRow {
  id: number;
  url: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function toBookmark(row: BookmarkDbRow): BookmarkRow {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BookmarksRepository {
  private readonly listStatement: Statement;
  private readonly findByIdStatement: Statement;

  constructor(database: LinkboxDatabase) {
    this.listStatement = database.prepare(`
      SELECT id, url, title, description, created_at, updated_at
      FROM bookmarks
      ORDER BY created_at DESC, id DESC
    `);
    this.findByIdStatement = database.prepare(`
      SELECT id, url, title, description, created_at, updated_at
      FROM bookmarks
      WHERE id = ?
    `);
  }

  list(): BookmarkRow[] {
    return this.listStatement.all().map((row) => toBookmark(row as BookmarkDbRow));
  }

  findById(id: number): BookmarkRow | null {
    const row = this.findByIdStatement.get(id) as BookmarkDbRow | undefined;
    return row ? toBookmark(row) : null;
  }
}
