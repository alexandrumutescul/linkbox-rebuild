import path from 'node:path';

export type NodeEnvironment = 'development' | 'production' | 'test';

export interface ServerConfig {
  port: number;
  nodeEnv: NodeEnvironment;
  isProduction: boolean;
  isDevelopment: boolean;
  dbPath: string;
  apiToken: string;
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3000;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function parseNodeEnv(value: string | undefined): NodeEnvironment {
  if (value === 'production' || value === 'test') {
    return value;
  }

  return 'development';
}

function parseApiToken(value: string | undefined, nodeEnv: NodeEnvironment): string {
  const token = value?.trim() ?? '';

  if (!token && nodeEnv !== 'test') {
    throw new Error('LINKBOX_API_TOKEN must be set');
  }

  return token;
}

function parseDbPath(value: string | undefined): string {
  const dbPath = value?.trim();

  if (dbPath) {
    return dbPath;
  }

  return path.resolve(process.cwd(), 'data/linkbox.sqlite');
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);

  return {
    port: parsePort(env.PORT),
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    dbPath: parseDbPath(env.LINKBOX_DB_PATH),
    apiToken: parseApiToken(env.LINKBOX_API_TOKEN, nodeEnv),
  };
}
