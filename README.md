# AtlasAI

[![CI](https://github.com/mejbahshameem/atlas-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/mejbahshameem/atlas-ai/actions/workflows/ci.yml)

Internal knowledge base with AI-powered search. Teams upload documentation, then ask questions in natural language — the system finds relevant docs and generates answers via OpenAI.

## Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS 11, TypeScript, Prisma 7 |
| Frontend | Next.js 16 (App Router), Tailwind CSS 4 |
| Database | PostgreSQL (Neon), pgvector |
| AI | OpenAI API (text-embedding-3-small) |
| Infra | Docker, GitHub Actions CI |

## Project layout

```
apps/
  api/       NestJS backend (port 3001)
  web/       Next.js frontend (port 3000)
```

## Setup

```bash
git clone https://github.com/mejbahshameem/atlas-ai.git
cd atlas-ai
cp .env.example .env
# fill in DATABASE_URL and other values

cd apps/api
npm install
npx prisma migrate dev
npm run start:dev

# separate terminal
cd apps/web
npm install
npm run dev
```

Health check: `GET http://localhost:3001/health`

## Testing

The API has **79 automated tests** (70 unit + 9 e2e) covering authentication, RBAC, CRUD operations, the AI chunking/embedding pipeline, and full HTTP request validation.

```bash
cd apps/api

# unit tests
npm test

# unit tests with coverage report
npm run test:cov

# end-to-end tests
npm run test:e2e
```

Tests run automatically on every push and pull request via [GitHub Actions](.github/workflows/ci.yml).

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| Auth | 100% | 80% | 100% | 100% |
| Organizations | 100% | 92% | 100% | 100% |
| Knowledge Bases | 97% | 82% | 100% | 96% |
| Documents | 100% | 88% | 81% | 100% |
| AI Chunking | 100% | 87% | 100% | 100% |
| AI Search | 100% | 78% | 100% | 100% |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register |
| `POST` | `/api/auth/login` | No | Login |
| `POST` | `/api/auth/refresh` | No | Refresh tokens |
| `GET` | `/api/auth/me` | JWT | Current user profile |
| `GET` | `/api/organizations` | JWT | List user's organizations |
| `POST` | `/api/organizations` | JWT | Create organization |
| `GET` | `/api/organizations/:slug` | JWT | Get organization |
| `PATCH` | `/api/organizations/:slug` | JWT | Update organization |
| `DELETE` | `/api/organizations/:slug` | JWT | Delete organization (owner only) |
| `POST` | `/api/organizations/:slug/members` | JWT | Add member |
| `DELETE` | `/api/organizations/:slug/members/:id` | JWT | Remove member |
| `GET` | `/api/organizations/:slug/knowledge-bases` | JWT | List knowledge bases |
| `POST` | `/api/organizations/:slug/knowledge-bases` | JWT | Create knowledge base |
| `GET` | `/api/organizations/:slug/knowledge-bases/:id` | JWT | Get knowledge base |
| `PATCH` | `/api/organizations/:slug/knowledge-bases/:id` | JWT | Update knowledge base |
| `DELETE` | `/api/organizations/:slug/knowledge-bases/:id` | JWT | Delete knowledge base |
| `GET` | `/api/organizations/:slug/knowledge-bases/:id/documents` | JWT | List documents |
| `POST` | `/api/organizations/:slug/knowledge-bases/:id/documents` | JWT | Create document |
| `GET` | `/api/organizations/:slug/knowledge-bases/:id/documents/:docId` | JWT | Get document |
| `PATCH` | `/api/organizations/:slug/knowledge-bases/:id/documents/:docId` | JWT | Update document |
| `DELETE` | `/api/organizations/:slug/knowledge-bases/:id/documents/:docId` | JWT | Delete document |
| `POST` | `/api/organizations/:slug/knowledge-bases/:id/search` | JWT | Semantic search |

## Security

- JWT authentication with access + refresh token rotation
- Passwords hashed with bcrypt (cost 12)
- Role-based access control (Owner / Admin / Member)
- Rate limiting: 30 req/min global, stricter on auth routes
- Helmet security headers
- Input validation on all endpoints (class-validator)
- CORS restricted to frontend origin

## License

MIT
