# AtlasAI

AI-powered knowledge base SaaS for engineering teams.

Teams store internal documentation and ask natural language questions — AtlasAI retrieves relevant docs and generates answers using AI.

## Tech Stack

- **Backend:** NestJS, TypeScript, Prisma ORM
- **Frontend:** Next.js 14 (App Router), Tailwind CSS
- **Database:** PostgreSQL (Neon)
- **AI:** OpenAI API
- **Infra:** Docker, GitHub Actions CI/CD

## Architecture

```
Next.js Frontend
       ↓ REST API
NestJS Backend
       ↓ Prisma ORM
PostgreSQL (Neon)
       ↓
OpenAI API
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker (optional, for local PostgreSQL)
- Neon account (free) or local PostgreSQL

### Setup

```bash
# Clone the repo
git clone https://github.com/mejbahshameem/atlas-ai.git
cd atlas-ai

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets

# Install API dependencies
cd apps/api
npm install

# Run database migrations
npx prisma migrate dev

# Start the API
npm run start:dev

# In a new terminal — install and start frontend
cd apps/web
npm install
npm run dev
```

### Verify

- API health check: [http://localhost:3001/health](http://localhost:3001/health)
- Frontend: [http://localhost:3000](http://localhost:3000)
- API docs (Swagger): [http://localhost:3001/api/docs](http://localhost:3001/api/docs) *(coming soon)*

## Project Structure

```
atlas-ai/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT
