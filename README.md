# AtlasAI

Internal knowledge base with AI powered search. Teams upload documentation, then ask questions in natural language. The system finds relevant documents and generates answers via OpenAI.

## Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS, TypeScript, Prisma 7 |
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Database | PostgreSQL (Neon) |
| AI | OpenAI API |
| Infra | Docker, GitHub Actions |

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

## License

MIT
