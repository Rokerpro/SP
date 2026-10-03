# Bolt

Bolt is a short-form learning platform for the Education and Learning hackathon theme.

## Phase 1 foundation

The repository currently contains the React + Vite frontend, the Node.js + Express TypeScript API, Tailwind CSS, and a MongoDB Docker Compose definition.

### Requirements

- Node.js 20+
- npm 10+
- Docker with the Compose plugin

### Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The frontend runs at http://localhost:5173 and the API runs at http://localhost:3001. Verify the API with:

```bash
curl http://localhost:3001/api/health
```

### Start MongoDB

```bash
docker compose up -d mongodb
```

MongoDB is exposed on port 27017 with persistent storage in the `bolt-mongodb` Docker volume. Database models and seed data will be added in Phase 2.

### Build

```bash
npm run build
```
