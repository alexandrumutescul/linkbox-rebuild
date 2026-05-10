import { Router } from 'express';
import type { ServerConfig } from '../config.js';
import type { LinkboxDatabase } from '../db/connection.js';
import { BookmarksRepository } from '../db/repositories/bookmarksRepository.js';
import { TagsRepository } from '../db/repositories/tagsRepository.js';
import { requireBearerToken } from '../middleware/auth.js';
import { createBookmarksRouter } from './bookmarks.js';
import { createHealthRouter } from './health.js';
import { createTagsRouter } from './tags.js';

interface RoutesDependencies {
  config: ServerConfig;
  database: LinkboxDatabase;
}

export function createApiRouter({ config, database }: RoutesDependencies): Router {
  const router = Router();
  const bookmarksRepository = new BookmarksRepository(database);
  const tagsRepository = new TagsRepository(database);

  router.use(createHealthRouter());
  router.use(requireBearerToken(config));
  router.use('/bookmarks', createBookmarksRouter(bookmarksRepository));
  router.use('/tags', createTagsRouter(tagsRepository));

  return router;
}
