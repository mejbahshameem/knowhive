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
