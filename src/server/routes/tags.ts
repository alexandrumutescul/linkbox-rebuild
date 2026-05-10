import { Router } from 'express';
import type { TagsRepository } from '../db/repositories/tagsRepository.js';

export function createTagsRouter(tagsRepository: TagsRepository): Router {
  const router = Router();

  router.get('/', (_request, response, next) => {
    try {
      response.json({ tags: tagsRepository.listWithCounts() });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
