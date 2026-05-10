import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { type ServerConfig } from '../../src/server/config.js';
import { createApp } from '../../src/server/index.js';

const tempDirs: string[] = [];
const token = 'secret';

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

function api(app: Awaited<ReturnType<typeof createApp>>) {
  return request(app).set('Authorization', `Bearer ${token}`);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('bookmarks API', () => {
  it('creates a bookmark with URL, title, notes, normalized tags, generated id, and timestamps', async () => {
    const app = await createApp(testConfig());

    const response = await api(app)
      .post('/api/bookmarks')
      .send({
        url: ' https://example.com/article ',
        title: ' Example Article ',
        notes: ' Read later ',
        tags: [' Work ', 'work', 'TypeScript'],
      })
      .expect(201);

    expect(response.body.bookmark).toMatchObject({
      id: expect.any(Number),
      url: 'https://example.com/article',
      title: 'Example Article',
      notes: 'Read later',
      tags: ['typescript', 'work'],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('lists bookmarks newest first with tag arrays included', async () => {
    const app = await createApp(testConfig());

    const first = await api(app).post('/api/bookmarks').send({ url: 'https://example.com/one', title: 'One', tags: ['first'] });
    const second = await api(app).post('/api/bookmarks').send({ url: 'https://example.com/two', title: 'Two', tags: ['second'] });

    const response = await api(app).get('/api/bookmarks').expect(200);

    expect(response.body.bookmarks).toHaveLength(2);
    expect(response.body.bookmarks[0]).toMatchObject({ id: second.body.bookmark.id, tags: ['second'] });
    expect(response.body.bookmarks[1]).toMatchObject({ id: first.body.bookmark.id, tags: ['first'] });
  });

  it('reads a bookmark by id', async () => {
    const app = await createApp(testConfig());
    const created = await api(app).post('/api/bookmarks').send({ url: 'https://example.com/read', title: 'Read', tags: ['docs'] });

    const response = await api(app).get(`/api/bookmarks/${created.body.bookmark.id}`).expect(200);

    expect(response.body).toEqual({ bookmark: created.body.bookmark });
  });

  it('patches bookmark fields and replaces tags', async () => {
    const app = await createApp(testConfig());
    const created = await api(app)
      .post('/api/bookmarks')
      .send({ url: 'https://example.com/old', title: 'Old title', notes: 'old notes', tags: ['old', 'shared'] });

    const patched = await api(app)
      .patch(`/api/bookmarks/${created.body.bookmark.id}`)
      .send({ title: 'New title', notes: null, tags: [' New ', 'new'] })
      .expect(200);

    expect(patched.body.bookmark).toMatchObject({
      id: created.body.bookmark.id,
      url: 'https://example.com/old',
      title: 'New title',
      notes: null,
      tags: ['new'],
    });

    const reread = await api(app).get(`/api/bookmarks/${created.body.bookmark.id}`).expect(200);
    expect(reread.body.bookmark.tags).toEqual(['new']);
    expect(reread.body.bookmark.title).toBe('New title');
  });

  it('deletes a bookmark and removes it from later lists', async () => {
    const app = await createApp(testConfig());
    const keep = await api(app).post('/api/bookmarks').send({ url: 'https://example.com/keep', title: 'Keep' });
    const remove = await api(app).post('/api/bookmarks').send({ url: 'https://example.com/remove', title: 'Remove' });

    await api(app).delete(`/api/bookmarks/${remove.body.bookmark.id}`).expect(204);

    await api(app).get(`/api/bookmarks/${remove.body.bookmark.id}`).expect(404);
    const response = await api(app).get('/api/bookmarks').expect(200);
    expect(response.body.bookmarks.map((bookmark: { id: number }) => bookmark.id)).toEqual([keep.body.bookmark.id]);
  });

  it('returns validation errors for invalid create and patch payloads', async () => {
    const app = await createApp(testConfig());

    const invalidCreate = await api(app).post('/api/bookmarks').send({ url: 'notaurl', title: ' ', tags: ['ok', 3] }).expect(400);
    expect(invalidCreate.body.error).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(invalidCreate.body.error.details).toEqual(
      expect.arrayContaining(['url must be a valid URL', 'title is required', 'tags must contain only strings']),
    );

    const created = await api(app).post('/api/bookmarks').send({ url: 'https://example.com/valid', title: 'Valid' });
    const invalidPatch = await api(app).patch(`/api/bookmarks/${created.body.bookmark.id}`).send({ url: 'ftp://example.com' }).expect(400);
    expect(invalidPatch.body.error).toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
