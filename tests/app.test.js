import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';

async function listen(app) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()))
  };
}

test('GET /api/health returns unauthenticated ok status payload and hides Express header', async () => {
  const app = createApp({ isProduction: false });
  const server = await listen(app);
  try {
    const response = await fetch(`${server.origin}/api/health`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.deepEqual(await response.json(), {
      ok: true,
      status: 'ok',
      service: 'linkbox'
    });
  } finally {
    await server.close();
  }
});

test('unknown API routes return JSON 404 instead of SPA fallback', async () => {
  const app = createApp({ isProduction: false });
  const server = await listen(app);
  try {
    const response = await fetch(`${server.origin}/api/missing`);
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await response.json(), { ok: false, error: 'Not found' });
  } finally {
    await server.close();
  }
});

test('production mode serves built SPA assets and falls back to index.html for client routes', async () => {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'linkbox-dist-'));
  await writeFile(path.join(distDir, 'index.html'), '<!doctype html><h1>Linkbox shell</h1>', 'utf8');
  await writeFile(path.join(distDir, 'asset.txt'), 'static asset', 'utf8');

  const app = createApp({ isProduction: true, clientDistDir: distDir });
  const server = await listen(app);
  try {
    const root = await fetch(`${server.origin}/`);
    assert.equal(root.status, 200);
    assert.match(root.headers.get('content-type'), /text\/html/);
    assert.match(await root.text(), /Linkbox shell/);

    const asset = await fetch(`${server.origin}/asset.txt`);
    assert.equal(asset.status, 200);
    assert.equal(await asset.text(), 'static asset');

    const clientRoute = await fetch(`${server.origin}/links/123`);
    assert.equal(clientRoute.status, 200);
    assert.match(await clientRoute.text(), /Linkbox shell/);

    const apiMissing = await fetch(`${server.origin}/api/not-a-route`);
    assert.equal(apiMissing.status, 404);
    assert.match(apiMissing.headers.get('content-type'), /application\/json/);
  } finally {
    await server.close();
    await rm(distDir, { recursive: true, force: true });
  }
});
