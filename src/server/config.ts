export type NodeEnvironment = 'development' | 'production' | 'test';

export interface ServerConfig {
  port: number;
  nodeEnv: NodeEnvironment;
  isProduction: boolean;
  isDevelopment: boolean;
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);

  return {
    port: parsePort(env.PORT),
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
  };
}
