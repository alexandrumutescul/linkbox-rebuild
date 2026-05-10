import type { CreateBookmarkInput, PatchBookmarkInput } from '../types/bookmark.js';

export class ValidationError extends Error {
  readonly status = 400;
  readonly code = 'VALIDATION_FAILED';
  readonly details: string[];

  constructor(details: string[]) {
    super(details[0] ?? 'Invalid request payload');
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateUrl(value: unknown, fieldName: string, errors: string[]): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${fieldName} is required`);
    return undefined;
  }

  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      errors.push(`${fieldName} must be an HTTP or HTTPS URL`);
      return undefined;
    }
  } catch {
    errors.push(`${fieldName} must be a valid URL`);
    return undefined;
  }

  return trimmed;
}

function validateTitle(value: unknown, fieldName: string, errors: string[]): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${fieldName} is required`);
    return undefined;
  }

  return value.trim();
}

function validateNotes(value: unknown, errors: string[]): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    errors.push('notes must be a string or null');
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeTags(value: unknown, errors: string[], fieldName = 'tags'): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array of strings`);
    return undefined;
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const tag of value) {
    if (typeof tag !== 'string') {
      errors.push(`${fieldName} must contain only strings`);
      continue;
    }

    const name = tag.trim().toLowerCase();
    if (name === '' || seen.has(name)) {
      continue;
    }

    seen.add(name);
    normalized.push(name);
  }

  return normalized;
}

export function validateCreateBookmarkPayload(payload: unknown): CreateBookmarkInput {
  const errors: string[] = [];
  if (!isRecord(payload)) {
    throw new ValidationError(['request body must be an object']);
  }

  const url = validateUrl(payload.url, 'url', errors);
  const title = validateTitle(payload.title, 'title', errors);
  const notes = validateNotes(payload.notes, errors);
  const tags = normalizeTags(payload.tags, errors) ?? [];

  if (errors.length > 0 || url === undefined || title === undefined) {
    throw new ValidationError(errors);
  }

  return {
    url,
    title,
    notes: notes ?? null,
    tags,
  };
}

export function validatePatchBookmarkPayload(payload: unknown): PatchBookmarkInput {
  const errors: string[] = [];
  if (!isRecord(payload)) {
    throw new ValidationError(['request body must be an object']);
  }

  const patch: PatchBookmarkInput = {};

  if ('url' in payload) {
    const url = validateUrl(payload.url, 'url', errors);
    if (url !== undefined) {
      patch.url = url;
    }
  }

  if ('title' in payload) {
    const title = validateTitle(payload.title, 'title', errors);
    if (title !== undefined) {
      patch.title = title;
    }
  }

  if ('notes' in payload) {
    const notes = validateNotes(payload.notes, errors);
    if (notes !== undefined) {
      patch.notes = notes;
    }
  }

  if ('tags' in payload) {
    const tags = normalizeTags(payload.tags, errors);
    if (tags !== undefined) {
      patch.tags = tags;
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return patch;
}

export function parseBookmarkId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ValidationError(['id must be a positive integer']);
  }

  return id;
}
