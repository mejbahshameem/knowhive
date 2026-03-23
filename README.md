# AtlasAI

[![CI](https://github.com/mejbahshameem/atlas-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/mejbahshameem/atlas-ai/actions/workflows/ci.yml)

Internal knowledge base with AI powered search. Teams upload documentation, then ask questions in natural language. The system finds relevant documents and generates answers via OpenAI.

## Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS 11, TypeScript, Prisma 7 |
| Frontend | Next.js 16.2.1 (App Router), React 19, Tailwind CSS 4 |
| Database | PostgreSQL (Neon), pgvector |
| AI | OpenAI API (text-embedding-3-small) |
| Infra | Docker, GitHub Actions CI |

## Project layout

```
apps/
  api/       NestJS backend (port 3001)
  web/       Next.js frontend (port 3000)
```

## Frontend

The frontend uses a custom design system built on Tailwind CSS 4 with CSS custom properties for theming.

**Color palette:** Teal primary (`#0f766e`) with amber accents (`#d97706`) and warm stone neutrals instead of the standard blue/indigo. The palette was chosen to feel distinct from typical AI product templates.

**Dark mode:** Class based dark mode with automatic detection of system preference. Persisted to localStorage. A theme toggle is available in the navigation bar.

**Key pages:**

| Route | Description |
|-------|-------------|
| `/` | Landing page with product preview mockup and bento grid features |
| `/login` | Login form with redirect support |
| `/register` | Registration form |
| `/dashboard` | Organization listing |
| `/dashboard/[slug]` | Knowledge bases in an organization |
| `/dashboard/[slug]/[kbId]` | Documents with status indicators |
| `/dashboard/[slug]/[kbId]/[docId]` | Document detail with edit and delete |
| `/dashboard/[slug]/[kbId]/search` | Semantic search with relevance scoring |

See [apps/web/README.md](apps/web/README.md) for detailed frontend documentation.

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

The project has **94 automated tests** covering the backend (unit + API e2e) and the frontend (Playwright browser e2e).

### Backend (Jest)

79 tests (70 unit + 9 e2e) covering authentication, RBAC, CRUD operations, the AI chunking/embedding pipeline, and full HTTP request validation.

```bash
cd apps/api

# unit tests
npm test

# unit tests with coverage report
npm run test:cov

# end-to-end tests (API level)
npm run test:e2e
```

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| Auth | 100% | 80% | 100% | 100% |
| Organizations | 100% | 92% | 100% | 100% |
| Knowledge Bases | 97% | 82% | 100% | 96% |
| Documents | 100% | 88% | 81% | 100% |
| AI Chunking | 100% | 87% | 100% | 100% |
| AI Search | 100% | 78% | 100% | 100% |

### Frontend (Playwright)

15 browser tests running in Chromium covering authentication flows, dashboard CRUD, document management, semantic search, and navigation.

```bash
cd apps/web

# run all e2e tests (headless)
npm run test:e2e

# run with visible browser
npm run test:e2e:headed

# run with Playwright UI mode
npm run test:e2e:ui

# open the HTML report after a run
npm run test:e2e:report
```

| Spec File | Tests | Coverage |
|-----------|-------|----------|
| auth.spec.ts | 7 | Landing page, registration, login, auth guard |
| dashboard.spec.ts | 4 | Org CRUD, KB CRUD, empty states, navigation |
| documents.spec.ts | 4 | Document creation, search page, breadcrumbs |

Tests run automatically on every push and pull request via [GitHub Actions](.github/workflows/ci.yml).

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
