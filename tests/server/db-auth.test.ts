import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { type ServerConfig } from '../../src/server/config.js';
import { createApp } from '../../src/server/index.js';

const tempDirs: string[] = [];

function testConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  const dir = mkdtempSync(path.join(tmpdir(), 'linkbox-'));
  tempDirs.push(dir);

  return {
    port: 0,
    nodeEnv: 'test',
    isProduction: false,
    isDevelopment: false,
    dbPath: path.join(dir, 'linkbox.sqlite'),
    apiToken: 'secret',
    ...overrides,
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('database initialization and API authentication', () => {
  it('creates bookmark and tag tables when the app starts', async () => {
    const config = testConfig();
    await createApp(config);

    const database = new Database(config.dbPath, { readonly: true });
    try {
      const tables = database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('bookmarks', 'tags', 'bookmark_tags')")
        .all()
        .map((row) => (row as { name: string }).name);

      expect(tables.sort()).toEqual(['bookmark_tags', 'bookmarks', 'tags']);
    } finally {
      database.close();
    }
  });

  it('returns stable 401 JSON for protected routes without bearer token', async () => {
    const app = await createApp(testConfig());

    const response = await request(app).get('/api/bookmarks').expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    });
  });

  it('allows GET health checks without bearer authentication only for the public health endpoint', async () => {
    const app = await createApp(testConfig());

    await request(app).get('/api/health').expect(200, { ok: true });

    const response = await request(app).post('/api/health').expect(401);
    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    });
  });

  it('requires the exact configured bearer token for unknown API routes', async () => {
    const app = await createApp(testConfig({ apiToken: 'top-secret' }));

    await request(app).get('/api/unknown').expect(401);
    await request(app).get('/api/unknown').set('Authorization', 'Bearer wrong-secret').expect(401);
    await request(app).get('/api/unknown').set('Authorization', 'Bearer top-secret').expect(404);
  });

  it('allows protected routes with the configured bearer token', async () => {
    const app = await createApp(testConfig({ apiToken: 'top-secret' }));

    const response = await request(app).get('/api/bookmarks').set('Authorization', 'Bearer top-secret').expect(200);

    expect(response.body).toEqual({ bookmarks: [] });
  });
});
