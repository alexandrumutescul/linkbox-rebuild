import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parsePort(value) {
  const port = Number.parseInt(value ?? '3000', 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function resolveFromRoot(value) {
  if (path.isAbsolute(value)) {
    return value;
  }

  return path.resolve(rootDir, value);
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isTest = nodeEnv === 'test';
  const apiToken = env.LINKBOX_API_TOKEN;

  if (!apiToken && !isTest) {
    throw new Error('LINKBOX_API_TOKEN is required. Set it before starting Linkbox.');
  }

  return {
    apiToken,
    nodeEnv,
    port: parsePort(env.PORT),
    rootDir,
    isProduction: nodeEnv === 'production',
    clientDistDir: resolveFromRoot(env.CLIENT_DIST_DIR || 'client/dist')
  };
}
