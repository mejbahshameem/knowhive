# KnowHive API

Backend service for KnowHive. Built with NestJS, Prisma, and PostgreSQL.

## Running locally

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

Server starts at `http://localhost:3001`. Health check at `GET /health`.

## API Documentation

Interactive Swagger UI is available at **http://localhost:3001/api/docs** when the server is running. All endpoints are documented with request/response schemas and example values.

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

### Search

Semantic search across documents in a knowledge base using OpenAI embeddings and pgvector.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `.../knowledge-bases/:kbId/search` | Bearer | Semantic search (members) |

Full search path: `/api/organizations/:slug/knowledge-bases/:kbId/search`

Request body: `{ "query": "your search terms" }`

Documents are automatically chunked and embedded when created or updated. Search returns the most relevant chunks ranked by cosine similarity, along with source document metadata.

**Note:** Requires `OPENAI_API_KEY` in `.env` for embeddings. Without it, documents are chunked but not embedded, and search will return no results.

## Security and Error Handling

### Error Response Format

All error responses follow a consistent shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-03-31T12:00:00.000Z",
  "path": "/api/auth/login"
}
```

### Security Headers

Helmet middleware sets production-grade HTTP headers including `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, and others.

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Global | 30 requests | 60 seconds |
| `POST /auth/register` | 5 requests | 60 seconds |
| `POST /auth/login` | 10 requests | 60 seconds |
| `POST /auth/refresh` | 10 requests | 60 seconds |

### Request Logging

Every request is logged with method, URL, status code, and response time.

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
