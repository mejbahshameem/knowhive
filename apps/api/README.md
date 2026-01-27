# AtlasAI API

Backend service for AtlasAI. Built with NestJS, Prisma, and PostgreSQL.

## Running locally

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

Server starts at `http://localhost:3001`. Health check at `GET /health`.

## API endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account, returns tokens |
| POST | `/api/auth/login` | No | Login, returns tokens |
| POST | `/api/auth/refresh` | No | Exchange refresh token for new pair |
| GET | `/api/auth/me` | Bearer | Get current user profile |

### Organizations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/organizations` | Bearer | Create organization (caller becomes OWNER) |
| GET | `/api/organizations` | Bearer | List caller's organizations |
| GET | `/api/organizations/:slug` | Bearer | Get organization by slug (members only) |
| PATCH | `/api/organizations/:slug` | Bearer | Update organization (ADMIN+) |
| DELETE | `/api/organizations/:slug` | Bearer | Delete organization (OWNER only) |
| POST | `/api/organizations/:slug/members` | Bearer | Add member (ADMIN+) |
| DELETE | `/api/organizations/:slug/members/:memberId` | Bearer | Remove member (ADMIN+) |

### Knowledge Bases

All KB routes are scoped under an organization.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/organizations/:slug/knowledge-bases` | Bearer | Create knowledge base (members) |
| GET | `/api/organizations/:slug/knowledge-bases` | Bearer | List org's knowledge bases (members) |
| GET | `/api/organizations/:slug/knowledge-bases/:kbId` | Bearer | Get knowledge base (members) |
| PATCH | `/api/organizations/:slug/knowledge-bases/:kbId` | Bearer | Update knowledge base (members) |
| DELETE | `/api/organizations/:slug/knowledge-bases/:kbId` | Bearer | Delete knowledge base (ADMIN+) |

### Documents

All document routes are scoped under a knowledge base.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `.../knowledge-bases/:kbId/documents` | Bearer | Create document (members) |
| GET | `.../knowledge-bases/:kbId/documents` | Bearer | List documents in KB (members) |
| GET | `.../knowledge-bases/:kbId/documents/:docId` | Bearer | Get document with content (members) |
| PATCH | `.../knowledge-bases/:kbId/documents/:docId` | Bearer | Update document (members) |
| DELETE | `.../knowledge-bases/:kbId/documents/:docId` | Bearer | Delete document (ADMIN+) |

Full document path: `/api/organizations/:slug/knowledge-bases/:kbId/documents`

## Environment

Requires a `.env` file in the project root (two levels up). See `.env.example`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled output |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint and auto-fix |
