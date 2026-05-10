import { Router } from 'express';
import type { ServerConfig } from '../config.js';
import type { LinkboxDatabase } from '../db/connection.js';
import { BookmarksRepository } from '../db/repositories/bookmarksRepository.js';
import { requireBearerToken } from '../middleware/auth.js';
import { createBookmarksRouter } from './bookmarks.js';
import { createHealthRouter } from './health.js';

interface RoutesDependencies {
  config: ServerConfig;
  database: LinkboxDatabase;
}

export function createApiRouter({ config, database }: RoutesDependencies): Router {
  const router = Router();
  const bookmarksRepository = new BookmarksRepository(database);

  router.use(createHealthRouter());
  router.use(requireBearerToken(config));
  router.use('/bookmarks', createBookmarksRouter(bookmarksRepository));

  return router;
}
