import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { type ServerConfig } from '../../src/server/config.js';
import { createApp } from '../../src/server/index.js';

const tempDirs: string[] = [];
const token = 'secret';

type TestApp = Awaited<ReturnType<typeof createApp>>;

function testConfig(): ServerConfig {
  const dir = mkdtempSync(path.join(tmpdir(), 'linkbox-'));
  tempDirs.push(dir);

  return {
    port: 0,
    nodeEnv: 'test',
    isProduction: false,
    isDevelopment: false,
    dbPath: path.join(dir, 'linkbox.sqlite'),
    apiToken: token,
  };
}

function api(app: TestApp) {
  const agent = request(app);
  return {
    get: (url: string) => agent.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => agent.post(url).set('Authorization', `Bearer ${token}`),
  };
}

async function createBookmark(app: TestApp, body: { url: string; title: string; notes?: string | null; tags?: string[] }) {
  const response = await api(app).post('/api/bookmarks').send(body).expect(201);
  return response.body.bookmark as { id: number; title: string };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('search and tags API', () => {
  it('searches bookmarks by title, URL, and notes', async () => {
    const app = await createApp(testConfig());
    const titleMatch = await createBookmark(app, { url: 'https://example.com/dinner', title: 'Recipe collection' });
    const urlMatch = await createBookmark(app, { url: 'https://recipes.example.com/pasta', title: 'Pasta' });
    const notesMatch = await createBookmark(app, { url: 'https://example.com/notes', title: 'Kitchen', notes: 'Favorite family recipe' });
    await createBookmark(app, { url: 'https://example.com/work', title: 'Quarterly planning', notes: 'Roadmap' });

    const response = await api(app).get('/api/bookmarks').query({ q: 'recipe' }).expect(200);

    expect(response.body.bookmarks.map((bookmark: { id: number }) => bookmark.id).sort((a: number, b: number) => a - b)).toEqual(
      [titleMatch.id, urlMatch.id, notesMatch.id].sort((a, b) => a - b),
    );
  });

  it('matches search text case-insensitively', async () => {
    const app = await createApp(testConfig());
    const created = await createBookmark(app, { url: 'https://example.com/typescript', title: 'TypeScript Handbook', notes: 'Language docs' });
    await createBookmark(app, { url: 'https://example.com/ruby', title: 'Ruby docs' });

    const response = await api(app).get('/api/bookmarks').query({ q: 'typescript' }).expect(200);

    expect(response.body.bookmarks).toHaveLength(1);
    expect(response.body.bookmarks[0].id).toBe(created.id);
  });

  it('filters bookmarks by normalized tag', async () => {
    const app = await createApp(testConfig());
    const work = await createBookmark(app, { url: 'https://example.com/work', title: 'Work link', tags: ['Work'] });
    await createBookmark(app, { url: 'https://example.com/personal', title: 'Personal link', tags: ['personal'] });

    const response = await api(app).get('/api/bookmarks').query({ tag: ' WORK ' }).expect(200);

    expect(response.body.bookmarks).toHaveLength(1);
    expect(response.body.bookmarks[0].id).toBe(work.id);
  });

  it('combines search and tag filters with matching and empty results', async () => {
    const app = await createApp(testConfig());
    const matching = await createBookmark(app, {
      url: 'https://example.com/work-recipe',
      title: 'Team recipe',
      notes: 'Shared lunch',
      tags: ['work'],
    });
    await createBookmark(app, { url: 'https://example.com/personal-recipe', title: 'Home recipe', tags: ['personal'] });
    await createBookmark(app, { url: 'https://example.com/work-plan', title: 'Team plan', tags: ['work'] });

    const nonEmpty = await api(app).get('/api/bookmarks').query({ q: 'recipe', tag: 'work' }).expect(200);
    expect(nonEmpty.body.bookmarks).toHaveLength(1);
    expect(nonEmpty.body.bookmarks[0].id).toBe(matching.id);

    const empty = await api(app).get('/api/bookmarks').query({ q: 'recipe', tag: 'missing' }).expect(200);
    expect(empty.body).toEqual({ bookmarks: [] });
  });

  it('returns all tags with bookmark counts ordered by name', async () => {
    const app = await createApp(testConfig());
    await createBookmark(app, { url: 'https://example.com/one', title: 'One', tags: ['work', 'typescript'] });
    await createBookmark(app, { url: 'https://example.com/two', title: 'Two', tags: ['work'] });
    await createBookmark(app, { url: 'https://example.com/three', title: 'Three', tags: ['personal'] });

    const response = await api(app).get('/api/tags').expect(200);

    expect(response.body).toEqual({
      tags: [
        { name: 'personal', bookmarkCount: 1 },
        { name: 'typescript', bookmarkCount: 1 },
        { name: 'work', bookmarkCount: 2 },
      ],
    });
  });
});
