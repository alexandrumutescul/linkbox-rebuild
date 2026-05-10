# Linkbox

Linkbox is a minimal single-process Node app: an Express API serves `/api` routes and, in production, the compiled Vite React SPA from `client/dist`.

## Requirements

- Node.js 20 or newer
- npm
- `LINKBOX_API_TOKEN` set in the environment before starting the server

## Setup

```sh
npm install
cp .env.example .env
```

The root package is configured as an npm workspace, so `npm install` installs both the Express server dependencies and the Vite/React dependencies declared in `client/package.json`.

Set `LINKBOX_API_TOKEN` in your shell or `.env` management tool before running server commands. The app reads environment variables directly; it does not load `.env` files automatically.

## Development

Start the API server:

```sh
LINKBOX_API_TOKEN=dev-secret npm run dev:server
```

Start the React app in another terminal:

```sh
npm run dev:client
```

Default URLs:

- Express API: <http://localhost:3000>
- Health endpoint: <http://localhost:3000/api/health>
- Vite SPA: <http://localhost:5173>

The Vite dev server proxies `/api` requests to the Express server.

## Production build and start

Build the SPA:

```sh
npm run build
```

Start the single Node process that serves both API and compiled SPA assets:

```sh
LINKBOX_API_TOKEN=prod-secret npm start
```

Open <http://localhost:3000> to view the Linkbox shell served by Express. API routes remain under `/api`, and `/api/health` returns an unauthenticated status payload.

## Configuration

Environment variables:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `LINKBOX_API_TOKEN` | Yes, except test mode | none | Bearer token used by future protected API routes. |
| `PORT` | No | `3000` | Port for the Express server. |
| `NODE_ENV` | No | `development` | Set to `production` to serve `client/dist`. |
| `CLIENT_DIST_DIR` | No | `client/dist` | Static asset directory for the compiled SPA. |
