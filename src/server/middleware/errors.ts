import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = typeof error?.status === 'number' ? error.status : 500;
  const message = status >= 500 ? 'Internal server error' : String(error?.message ?? 'Request failed');

  if (status >= 500) {
    console.error(error);
  }

  response.status(status).json({ error: message });
};
