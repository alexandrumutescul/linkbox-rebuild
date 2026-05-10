import type { LinkboxDatabase } from './connection.js';
import { schemaSql } from './schema.js';

export function runMigrations(database: LinkboxDatabase): void {
  database.exec(schemaSql);
}
