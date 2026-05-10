import { Router } from 'express';
import type { BookmarksRepository } from '../db/repositories/bookmarksRepository.js';
import { toBookmarkDto } from '../types/bookmark.js';
import { parseBookmarkId, validateCreateBookmarkPayload, validatePatchBookmarkPayload } from '../validation/bookmarks.js';
import { parseBookmarkListQuery } from '../validation/query.js';

function notFound(): Error & { status: number; code: string } {
  const error = new Error('Bookmark not found') as Error & { status: number; code: string };
  error.status = 404;
  error.code = 'NOT_FOUND';
  return error;
}

export function createBookmarksRouter(bookmarksRepository: BookmarksRepository): Router {
  const router = Router();

  router.post('/', (request, response, next) => {
    try {
      const input = validateCreateBookmarkPayload(request.body);
      const bookmark = bookmarksRepository.create(input);
      response.status(201).json({ bookmark: toBookmarkDto(bookmark) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/', (request, response, next) => {
    try {
      const filters = parseBookmarkListQuery(request.query);
      response.json({ bookmarks: bookmarksRepository.list(filters).map(toBookmarkDto) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', (request, response, next) => {
    try {
      const bookmark = bookmarksRepository.findById(parseBookmarkId(request.params.id));
      if (!bookmark) {
        next(notFound());
        return;
      }

      response.json({ bookmark: toBookmarkDto(bookmark) });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', (request, response, next) => {
    try {
      const id = parseBookmarkId(request.params.id);
      const input = validatePatchBookmarkPayload(request.body);
      const bookmark = bookmarksRepository.patch(id, input);
      if (!bookmark) {
        next(notFound());
        return;
      }

      response.json({ bookmark: toBookmarkDto(bookmark) });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', (request, response, next) => {
    try {
      const deleted = bookmarksRepository.delete(parseBookmarkId(request.params.id));
      if (!deleted) {
        next(notFound());
        return;
      }

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
