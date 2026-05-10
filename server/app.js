import express from 'express';
import path from 'node:path';
import healthRouter from './routes/health.js';

export function createApp(config) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.use('/api/health', healthRouter);

  app.use('/api', (req, res) => {
    res.status(404).json({
      ok: false,
      error: 'Not found'
    });
  });

  if (config.isProduction) {
    app.use(express.static(config.clientDistDir));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      return res.sendFile(path.join(config.clientDistDir, 'index.html'));
    });
  }

  return app;
}
