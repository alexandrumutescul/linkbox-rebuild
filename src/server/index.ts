import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { loadConfig, type ServerConfig } from './config.js';
import { errorHandler } from './middleware/errors.js';

const projectRoot = process.cwd();

export async function createApp(config: ServerConfig = loadConfig()) {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  if (config.isDevelopment) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const clientDist = path.resolve(projectRoot, 'dist/client');
    const indexHtml = path.join(clientDist, 'index.html');

    if (!existsSync(indexHtml)) {
      console.warn(`Built client assets were not found at ${clientDist}. Run npm run build before npm start.`);
    }

    app.use(express.static(clientDist));

    app.get('*', (request, response, next) => {
      if (request.path.startsWith('/api')) {
        next();
        return;
      }

      response.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const config = loadConfig();
  const app = await createApp(config);

  const server = app.listen(config.port, () => {
    console.log(`Linkbox listening at http://localhost:${config.port}`);
  });

  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`${signal} received; shutting down Linkbox.`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
