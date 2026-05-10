import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { loadConfig } from '../server/config.js';

test('loadConfig allows missing LINKBOX_API_TOKEN only in test mode', () => {
  const config = loadConfig({ NODE_ENV: 'test' });
  assert.equal(config.nodeEnv, 'test');
  assert.equal(config.apiToken, undefined);
  assert.equal(config.port, 3000);
  assert.equal(config.isProduction, false);
});

test('loadConfig requires LINKBOX_API_TOKEN outside test mode', () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: 'development' }),
    /LINKBOX_API_TOKEN is required/
  );
  assert.throws(
    () => loadConfig({ NODE_ENV: 'production' }),
    /LINKBOX_API_TOKEN is required/
  );
});

test('loadConfig parses valid port and rejects invalid port values', () => {
  assert.equal(loadConfig({ NODE_ENV: 'test', PORT: '65535' }).port, 65535);

  for (const invalid of ['0', '-1', '65536', 'abc', '']) {
    assert.throws(
      () => loadConfig({ NODE_ENV: 'test', PORT: invalid }),
      /PORT must be an integer between 1 and 65535/,
      `expected PORT=${JSON.stringify(invalid)} to be rejected`
    );
  }
});

test('loadConfig resolves relative CLIENT_DIST_DIR from repository root and preserves absolute paths', () => {
  const relative = loadConfig({ NODE_ENV: 'test', CLIENT_DIST_DIR: 'tmp/static' });
  assert.equal(relative.clientDistDir, path.resolve(process.cwd(), 'tmp/static'));

  const absolutePath = path.resolve(process.cwd(), 'custom-dist');
  const absolute = loadConfig({ NODE_ENV: 'test', CLIENT_DIST_DIR: absolutePath });
  assert.equal(absolute.clientDistDir, absolutePath);
});
