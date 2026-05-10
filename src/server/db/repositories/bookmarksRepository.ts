import type { Statement } from 'better-sqlite3';
import type { CreateBookmarkInput, PatchBookmarkInput, Bookmark } from '../../types/bookmark.js';
import type { LinkboxDatabase } from '../connection.js';
import { TagsRepository } from './tagsRepository.js';

interface BookmarkDbRow {
  id: number;
  url: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TagNameRow {
  name: string;
}

function toBookmark(row: BookmarkDbRow, tags: string[]): Bookmark {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    notes: row.description,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BookmarksRepository {
  private readonly tagsRepository: TagsRepository;
  private readonly listStatement: Statement;
  private readonly findByIdStatement: Statement;
  private readonly findTagsStatement: Statement;
  private readonly insertStatement: Statement;
  private readonly updateStatement: Statement;
  private readonly deleteStatement: Statement;
  private readonly deleteBookmarkTagsStatement: Statement;
  private readonly insertBookmarkTagStatement: Statement;

  constructor(private readonly database: LinkboxDatabase) {
    this.tagsRepository = new TagsRepository(database);
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
    this.findTagsStatement = database.prepare(`
      SELECT tags.name
      FROM tags
      INNER JOIN bookmark_tags ON bookmark_tags.tag_id = tags.id
      WHERE bookmark_tags.bookmark_id = ?
      ORDER BY tags.name ASC
    `);
    this.insertStatement = database.prepare(`
      INSERT INTO bookmarks (url, title, description)
      VALUES (?, ?, ?)
    `);
    this.updateStatement = database.prepare(`
      UPDATE bookmarks
      SET url = ?, title = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `);
    this.deleteStatement = database.prepare('DELETE FROM bookmarks WHERE id = ?');
    this.deleteBookmarkTagsStatement = database.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?');
    this.insertBookmarkTagStatement = database.prepare(`
      INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id)
      VALUES (?, ?)
    `);
  }

  create(input: CreateBookmarkInput): Bookmark {
    const id = this.database.transaction((bookmark: CreateBookmarkInput) => {
      const result = this.insertStatement.run(bookmark.url, bookmark.title, bookmark.notes);
      const bookmarkId = Number(result.lastInsertRowid);
      this.replaceTags(bookmarkId, bookmark.tags);
      return bookmarkId;
    })(input);

    const created = this.findById(id);
    if (!created) {
      throw new Error('Created bookmark could not be loaded');
    }

    return created;
  }

  list(): Bookmark[] {
    return this.listStatement.all().map((row) => this.hydrate(row as BookmarkDbRow));
  }

  findById(id: number): Bookmark | null {
    const row = this.findByIdStatement.get(id) as BookmarkDbRow | undefined;
    return row ? this.hydrate(row) : null;
  }

  patch(id: number, input: PatchBookmarkInput): Bookmark | null {
    const updated = this.database.transaction((bookmarkId: number, patch: PatchBookmarkInput) => {
      const current = this.findById(bookmarkId);
      if (!current) {
        return null;
      }

      const url = patch.url ?? current.url;
      const title = patch.title ?? current.title;
      const notes = Object.prototype.hasOwnProperty.call(patch, 'notes') ? (patch.notes ?? null) : current.notes;

      this.updateStatement.run(url, title, notes, bookmarkId);

      if (patch.tags !== undefined) {
        this.replaceTags(bookmarkId, patch.tags);
      }

      return this.findById(bookmarkId);
    })(id, input);

    return updated;
  }

  delete(id: number): boolean {
    const result = this.deleteStatement.run(id);
    return result.changes > 0;
  }

  private hydrate(row: BookmarkDbRow): Bookmark {
    const tags = this.findTagsStatement.all(row.id).map((tagRow) => (tagRow as TagNameRow).name);
    return toBookmark(row, tags);
  }

  private replaceTags(bookmarkId: number, tags: readonly string[]): void {
    this.deleteBookmarkTagsStatement.run(bookmarkId);
    const tagRows = this.tagsRepository.upsertMany(tags);

    for (const tag of tagRows) {
      this.insertBookmarkTagStatement.run(bookmarkId, tag.id);
    }
  }
}
