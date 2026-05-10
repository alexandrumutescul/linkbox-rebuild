import type { RequestHandler } from 'express';
import type { ServerConfig } from '../config.js';

export function requireBearerToken(config: Pick<ServerConfig, 'apiToken'>): RequestHandler {
  return (request, _response, next) => {
    if (request.method === 'GET' && (request.path === '/health' || request.path === '/health/')) {
      next();
      return;
    }

    const expectedAuthorization = `Bearer ${config.apiToken}`;
    const authorization = request.header('authorization');

    if (!config.apiToken || authorization !== expectedAuthorization) {
      const error = new Error('Unauthorized') as Error & { status: number; code: string };
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      next(error);
      return;
    }

    next();
  };
}
