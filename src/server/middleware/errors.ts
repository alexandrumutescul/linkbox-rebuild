import type { ErrorRequestHandler } from 'express';

interface HttpError extends Error {
  status?: number;
  code?: string;
  details?: string[];
}

function errorCodeFor(status: number, error: HttpError): string {
  if (error.code) {
    return error.code;
  }

  if (status === 401) {
    return 'UNAUTHORIZED';
  }

  if (status === 404) {
    return 'NOT_FOUND';
  }

  if (status >= 400 && status < 500) {
    return 'REQUEST_FAILED';
  }

  return 'INTERNAL_SERVER_ERROR';
}

export const errorHandler: ErrorRequestHandler = (error: HttpError, _request, response, _next) => {
  const status = typeof error?.status === 'number' ? error.status : 500;
  const message = status >= 500 ? 'Internal server error' : String(error?.message ?? 'Request failed');

  if (status >= 500) {
    console.error(error);
  }

  response.status(status).json({
    error: {
      code: errorCodeFor(status, error),
      message,
      ...(error.details && status < 500 ? { details: error.details } : {}),
    },
  });
};
