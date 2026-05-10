import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { ServerConfig } from '../config.js';

export type LinkboxDatabase = Database.Database;

export function openDatabase(config: Pick<ServerConfig, 'dbPath'>): LinkboxDatabase {
  const dbDirectory = path.dirname(config.dbPath);
  mkdirSync(dbDirectory, { recursive: true });

  const database = new Database(config.dbPath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');

  return database;
}
