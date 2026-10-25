# sammelliste

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Deploys the dist folder to GitHub Pages
```
npm run deploy
```

### Lints and fixes files
```
npm run lint
```

### Backend (docstore) and Home-Dashboard hub
The entries are stored on the server in a small SQLite docstore (`server/index.ts`,
`node:http` + `node:sqlite`, no dependencies, Node >= 22.18 or 24). `localStorage`
is only the local cache; conflicts between devices are detected via a revision
number (`409` → the server state is reloaded, no merge).

```
npm run server          # listens on 127.0.0.1:3300, DB in data/sammelliste.db
```

Env: `HOST`, `PORT`, `DB_PATH`, `BODY_LIMIT_BYTES`. Endpoints: `GET /health`,
`GET|PUT /docs/entries`. In production the Home-Dashboard hub serves `dist/`
under `/sammelliste/` and forwards `/sammelliste/api/*` to the backend (prefix
removed); the hub also handles the login (a `401` sends the app to `/login`).
During `npm run serve` the dev server proxies `/api/*` to the backend, so run
both. See `Home-Dashboard/docs/app-integration.md`.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
