import type { Statement } from 'better-sqlite3';
import type { LinkboxDatabase } from '../connection.js';

interface TagRow {
  id: number;
  name: string;
}

export function normalizeTagNames(tags: readonly string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const name = tag.trim().toLowerCase();
    if (name === '' || seen.has(name)) {
      continue;
    }

    seen.add(name);
    normalized.push(name);
  }

  return normalized;
}

export class TagsRepository {
  private readonly findByNameStatement: Statement;
  private readonly insertStatement: Statement;

  constructor(private readonly database: LinkboxDatabase) {
    this.findByNameStatement = database.prepare('SELECT id, name FROM tags WHERE name = ?');
    this.insertStatement = database.prepare('INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING');
  }

  upsertMany(tags: readonly string[]): TagRow[] {
    const names = normalizeTagNames(tags);
    if (names.length === 0) {
      return [];
    }

    const rows: TagRow[] = [];
    const upsert = this.database.transaction((tagNames: string[]) => {
      for (const name of tagNames) {
        this.insertStatement.run(name);
        const row = this.findByNameStatement.get(name) as TagRow | undefined;
        if (row) {
          rows.push(row);
        }
      }
    });

    upsert(names);
    return rows;
  }
}
