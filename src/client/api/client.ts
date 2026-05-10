import type { ApiErrorResponse } from '../../shared/apiTypes';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: string[];

  constructor(message: string, status: number, code?: string, details?: string[]) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  token: string;
  headers?: HeadersInit;
}

function hasJsonContent(response: Response): boolean {
  return response.headers.get('content-type')?.includes('application/json') ?? false;
}

async function parseJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  if (!hasJsonContent(response)) {
    return response.text();
  }

  return response.json();
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorResponse).error?.message === 'string'
  );
}

function errorMessageFor(status: number, body: unknown): { message: string; code?: string; details?: string[] } {
  if (isApiErrorResponse(body)) {
    return {
      message: body.error.message,
      code: body.error.code,
      details: body.error.details,
    };
  }

  if (typeof body === 'string' && body.trim()) {
    return { message: body.trim() };
  }

  return { message: `Request failed with status ${status}` };
}

export async function apiFetch<TResponse>(path: string, options: ApiRequestOptions): Promise<TResponse> {
  const { token, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, {
    ...init,
    headers: requestHeaders,
  });
  const body = await parseJson(response);

  if (!response.ok) {
    const error = errorMessageFor(response.status, body);
    throw new ApiClientError(error.message, response.status, error.code, error.details);
  }

  return body as TResponse;
}
