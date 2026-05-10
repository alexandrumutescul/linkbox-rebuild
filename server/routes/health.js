import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    status: 'ok',
    service: 'linkbox'
  });
});

export default router;
