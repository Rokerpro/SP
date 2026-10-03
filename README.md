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

MongoDB is exposed on port 27017 with persistent storage in the `bolt-mongodb` Docker volume.

Seed the lesson collection after MongoDB is running:

```bash
npm run seed --workspace backend
```

The API exposes `GET /api/lessons` and `GET /api/lessons/:slug` for the seeded lesson data.

Demo accounts created by the seed command:

| Email | Password |
| --- | --- |
| `alex@bolt.demo` | `BoltDemo123!` |
| `maya@bolt.demo` | `BoltLearn123!` |
| `sam@bolt.demo` | `BoltGreen123!` |

### Build

```bash
npm run build
```
