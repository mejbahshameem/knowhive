# AtlasAI Web

Frontend application for AtlasAI. Provides a full featured dashboard for managing organizations, knowledge bases, and documents, with a built in semantic search interface powered by the backend AI pipeline.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.1 | React framework with App Router |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility first styling |
| Lucide React | 1.7.x | Icon library |
| Playwright | 1.59.x | End to end testing |
| ESLint | 9.x | Code linting |

## Prerequisites

Before running the frontend, make sure the backend API is running on port 3001. See the [backend README](../api/README.md) for setup instructions.

Create a `.env.local` file in this directory:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Getting Started

```bash
npm install
npm run dev
```

The application starts at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create optimized production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint checks |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:headed` | Run E2E tests with visible browser |
| `npm run test:e2e:ui` | Launch Playwright interactive UI mode |
| `npm run test:e2e:report` | Open the HTML test report |

## Project Structure

```
src/
├── app/                           App Router pages
│   ├── layout.tsx                 Root layout with AuthProvider
│   ├── page.tsx                   Landing page
│   ├── globals.css                Tailwind theme and global styles
│   ├── login/page.tsx             Login form
│   ├── register/page.tsx          Registration form
│   └── dashboard/
│       ├── layout.tsx             Protected layout with auth guard
│       ├── page.tsx               Organizations list
│       └── [slug]/
│           ├── page.tsx           Knowledge bases for an organization
│           └── [kbId]/
│               ├── page.tsx       Documents list for a knowledge base
│               ├── [docId]/
│               │   └── page.tsx   Document detail with edit and delete
│               └── search/
│                   └── page.tsx   Semantic search interface
├── components/
│   ├── navbar.tsx                 Top navigation bar with theme toggle
│   ├── theme-toggle.tsx           Dark/light mode toggle button
│   └── ui/
│       ├── button.tsx             Button with variants and loading state
│       ├── card.tsx               Card container with title and description
│       ├── input.tsx              Form input with label and error display
│       ├── modal.tsx              Dialog with keyboard and click outside handling
│       ├── spinner.tsx            Animated loading spinner
│       └── index.ts              Barrel export
├── context/
│   └── auth-context.tsx           Authentication context and provider
└── lib/
    └── api.ts                     API client with typed endpoints
e2e/                               Playwright test suite
├── global-setup.ts                Shared user registration before tests
├── helpers.ts                     Test utilities and custom fixtures
├── auth.spec.ts                   Authentication flow tests (7 tests)
├── dashboard.spec.ts              Dashboard CRUD tests (4 tests)
└── documents.spec.ts              Document and search tests (4 tests)
```

## Routes

| Path | Description | Auth Required |
|------|-------------|---------------|
| `/` | Landing page with feature overview | No |
| `/login` | User login | No |
| `/register` | New user registration | No |
| `/dashboard` | Organizations list | Yes |
| `/dashboard/[slug]` | Knowledge bases in an organization | Yes |
| `/dashboard/[slug]/[kbId]` | Documents in a knowledge base | Yes |
| `/dashboard/[slug]/[kbId]/[docId]` | Document detail with edit and delete | Yes |
| `/dashboard/[slug]/[kbId]/search` | Semantic search interface | Yes |

## Authentication

The app uses JWT tokens stored in `localStorage`. The `AuthProvider` context wraps the entire application and exposes `login`, `register`, `logout`, and the current `user` and `token`. Protected routes under `/dashboard` redirect unauthenticated users to `/login` via the dashboard layout guard.

## API Client

All backend communication goes through `src/lib/api.ts`, which provides typed methods organized by domain:

| Domain | Methods |
|--------|---------|
| Auth | `register`, `login`, `refresh`, `me` |
| Organizations | `list`, `get`, `create`, `update`, `remove` |
| Knowledge Bases | `list`, `get`, `create`, `remove` |
| Documents | `list`, `get`, `create`, `update`, `remove` |
| Search | `query` |

## UI Components

The component library lives in `src/components/ui/` and follows a consistent pattern with variant support:

| Component | Variants |
|-----------|----------|
| Button | `primary`, `secondary`, `danger`, `ghost` with `sm`, `md`, `lg` sizes |
| Card | Default and `hover` with `CardTitle` and `CardDescription` subcomponents |
| Input | Standard with optional `label` and `error` props |
| Modal | Dialog with `title`, Escape key close, and backdrop click close |
| Spinner | SVG animation with configurable size via `className` |

## Design System

The theme is defined in `src/app/globals.css` using CSS custom properties with Tailwind v4. The palette uses teal and amber instead of the standard blue/indigo, with warm stone neutrals for a distinctive look.

**Light mode:**

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#0f766e` | Teal, buttons and links |
| `--primary-hover` | `#115e59` | Hover state |
| `--primary-light` | `#ccfbf1` | Badges and highlights |
| `--accent` | `#d97706` | Amber, secondary highlights |
| `--danger` | `#dc2626` | Destructive actions |
| `--success` | `#16a34a` | Status indicators |
| `--background` | `#fafaf9` | Warm stone page background |
| `--foreground` | `#1c1917` | Primary text |

**Dark mode:** Automatically inverts using CSS custom property overrides in a `.dark` class. System preference is detected on load and can be toggled via the navbar. No flash of wrong theme thanks to an inline script in the root layout.

Fonts: Geist Sans (body) and Geist Mono (code), loaded via Google Fonts in the root layout.

## Docker

The included Dockerfile supports three stages:

```bash
# Development
docker build --target development -t atlas-web:dev .
docker run -p 3000:3000 atlas-web:dev

# Production
docker build --target production -t atlas-web:prod .
docker run -p 3000:3000 atlas-web:prod
```

The production image uses the Next.js standalone output for a minimal container size.

## Testing

15 end to end tests validate all critical user flows using Playwright with Chromium. Tests run sequentially with a single worker to avoid race conditions against the shared database. A global setup step pre registers a shared test user to stay within backend rate limits.

```bash
# make sure both API (port 3001) and frontend (port 3000) are running, then:
npm run test:e2e
```

| Spec | Tests | Coverage |
|------|-------|----------|
| `auth.spec.ts` | 7 | Landing page, registration, login, auth guard |
| `dashboard.spec.ts` | 4 | Organization and knowledge base CRUD |
| `documents.spec.ts` | 4 | Document creation, search, breadcrumb navigation |
