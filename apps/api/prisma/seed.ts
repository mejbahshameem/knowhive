import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean up previous seed data if it exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@knowhive.dev' },
  });
  if (existingUser) {
    console.log('🧹 Cleaning previous seed data...');
    await prisma.user.delete({ where: { id: existingUser.id } });
  }
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: 'knowhive-demo' },
  });
  if (existingOrg) {
    await prisma.organization.delete({ where: { id: existingOrg.id } });
  }

  // Test user
  const hashedPassword = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@knowhive.dev' },
    update: {},
    create: {
      email: 'demo@knowhive.dev',
      password: hashedPassword,
      name: 'Alex Demo',
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'knowhive-demo' },
    update: {},
    create: {
      name: 'KnowHive Demo',
      slug: 'knowhive-demo',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  });

  console.log(`✅ Organization created: ${org.name}`);

  // Knowledge bases
  const kbData = [
    {
      name: 'Engineering Handbook',
      description:
        'Technical standards, workflows, and best practices for the engineering team.',
    },
    {
      name: 'Product Design Guidelines',
      description:
        'Design system principles, accessibility standards, and UI/UX patterns.',
    },
    {
      name: 'Company Policies',
      description:
        'Internal policies covering remote work, data security, and compliance.',
    },
    {
      name: 'Onboarding Guide',
      description:
        'Everything new team members need to get started on day one.',
    },
  ];

  const knowledgeBases: Record<string, string> = {};

  for (const kb of kbData) {
    const created = await prisma.knowledgeBase.create({
      data: {
        name: kb.name,
        description: kb.description,
        organizationId: org.id,
      },
    });
    knowledgeBases[kb.name] = created.id;
    console.log(`✅ Knowledge Base created: ${kb.name}`);
  }

  // Documents
  const documents = [
    // Engineering Handbook (5 docs, interrelated for search)
    {
      kb: 'Engineering Handbook',
      title: 'API Design Standards',
      content: `# API Design Standards

## Overview

All public and internal APIs at KnowHive follow RESTful conventions. This document defines the standards every backend engineer must follow when designing endpoints.

## URL Structure

- Use lowercase, hyphen-separated resource names: \`/knowledge-bases\`, not \`/knowledgeBases\`
- Nest resources logically: \`/organizations/:slug/knowledge-bases/:kbId/documents\`
- Use plural nouns for collections: \`/users\`, \`/documents\`
- Avoid verbs in URLs — use HTTP methods to convey actions

## HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Read resources (safe, idempotent) |
| POST | Create a new resource |
| PUT | Full replacement of a resource |
| PATCH | Partial update |
| DELETE | Remove a resource |

## Versioning

We version APIs via URL prefix: \`/api/v1/\`. Breaking changes require a version bump. Non-breaking additions (new optional fields) can land in the current version.

## Response Format

All responses follow a consistent JSON structure:

\`\`\`json
{
  "id": "uuid",
  "title": "Document Title",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
\`\`\`

Error responses use RFC 7807 problem details:

\`\`\`json
{
  "statusCode": 404,
  "message": "Document not found",
  "error": "Not Found"
}
\`\`\`

## Authentication

All endpoints except health checks and auth routes require a valid JWT bearer token. Tokens are issued via \`POST /auth/login\` and refreshed via \`POST /auth/refresh\`.

## Rate Limiting

The API enforces rate limits using the Throttler module. Default limits are 60 requests per minute per IP. Authenticated users get higher limits.

## Pagination

List endpoints support cursor-based pagination. Use \`?cursor=<id>&take=20\` query parameters. Responses include a \`nextCursor\` field when more results exist.`,
    },
    {
      kb: 'Engineering Handbook',
      title: 'Code Review Guidelines',
      content: `# Code Review Guidelines

## Purpose

Code reviews ensure quality, share knowledge, and catch bugs before they reach production. Every pull request must be reviewed by at least one team member before merging.

## What to Look For

### Correctness
- Does the code do what the PR description says?
- Are edge cases handled?
- Are there any off-by-one errors or null reference risks?

### Security
- Are user inputs validated and sanitized?
- Are SQL queries parameterized (no raw string interpolation)?
- Are secrets kept out of source code?
- Are authorization checks in place for all endpoints?

### Performance
- Are there N+1 query patterns?
- Are large datasets paginated?
- Are expensive operations cached where appropriate?

### Readability
- Are function and variable names descriptive?
- Is the code self-documenting or well-commented where complex?
- Are functions small and focused (single responsibility)?

### Testing
- Are there unit tests for new logic?
- Do tests cover both happy paths and error cases?
- Are mocks used appropriately without over-mocking?

## Review Process

1. Author opens a PR with a clear description and linked issue
2. CI must pass before review (lint, tests, build)
3. Reviewer leaves comments — use "suggestion" blocks for small fixes
4. Author addresses feedback and re-requests review
5. Reviewer approves and author merges via squash merge

## Tone

Reviews should be constructive and respectful. Phrase feedback as questions or suggestions: "Could we simplify this by…" rather than "This is wrong." Praise good patterns when you see them.

## Turnaround

Aim to review PRs within 4 business hours. If you're blocked on a review, ping the reviewer in Slack. Stale PRs older than 3 days without review should be escalated to the tech lead.`,
    },
    {
      kb: 'Engineering Handbook',
      title: 'Git Workflow and Branching Strategy',
      content: `# Git Workflow and Branching Strategy

## Branch Model

We use a trunk-based development model with short-lived feature branches.

### Branch Naming

- \`feature/<ticket-id>-short-description\` — new features
- \`fix/<ticket-id>-short-description\` — bug fixes
- \`chore/<description>\` — maintenance, dependency updates
- \`docs/<description>\` — documentation changes

Examples: \`feature/KH-142-add-search-filters\`, \`fix/KH-198-null-chunk-error\`

## Main Branch

\`main\` is always deployable. Direct pushes to main are blocked — all changes go through pull requests.

## Workflow

1. Create a branch from \`main\`
2. Make small, focused commits
3. Push and open a pull request
4. Pass CI checks (lint, test, build)
5. Get at least one code review approval
6. Squash merge into \`main\`
7. Delete the feature branch

## Commit Messages

Follow Conventional Commits:

\`\`\`
feat(search): add relevance score to results
fix(auth): handle expired refresh token gracefully
docs(api): update swagger descriptions for documents
chore(deps): bump prisma to 7.5.0
\`\`\`

The format is \`type(scope): description\`. Keep the subject line under 72 characters.

## Rebasing vs Merging

- Rebase your feature branch onto \`main\` before opening a PR to keep history clean
- Never force-push to shared branches
- Use squash merge when merging PRs to keep \`main\` history linear

## Release Process

Deployments are triggered automatically when commits land on \`main\`. See the Deployment Process document for details on the CI/CD pipeline and environment promotion.`,
    },
    {
      kb: 'Engineering Handbook',
      title: 'Deployment Process',
      content: `# Deployment Process

## Overview

KnowHive uses a continuous deployment pipeline. Every merge to \`main\` triggers an automated build, test, and deploy sequence. This document covers the full pipeline from commit to production.

## Pipeline Stages

### 1. Build
- TypeScript compilation for the NestJS API
- Next.js production build for the web app
- Docker images built and tagged with the commit SHA

### 2. Test
- Unit tests run via Jest
- Lint checks via ESLint
- Type checking via \`tsc --noEmit\`
- End-to-end tests via Playwright (against a staging environment)

### 3. Deploy to Staging
- Docker images pushed to the container registry
- Staging environment updated via Docker Compose
- Database migrations applied automatically
- Smoke tests verify core endpoints respond

### 4. Deploy to Production
- After staging passes, production deploy is triggered
- Blue-green deployment: new containers start alongside old ones
- Health check passes → traffic switches to new containers
- Old containers drain and shut down

## Environment Variables

All secrets and configuration live in environment variables, never in code. Each environment (dev, staging, prod) has its own set managed via the deployment platform.

Key variables:
- \`DATABASE_URL\` — PostgreSQL connection string
- \`JWT_SECRET\` / \`JWT_REFRESH_SECRET\` — Token signing keys
- \`OPENAI_API_KEY\` — For embedding generation
- \`FRONTEND_URL\` — CORS origin

## Rollback

If a production deploy causes issues:
1. Revert the PR on GitHub
2. The revert commit triggers a new deploy automatically
3. For urgent rollbacks, manually redeploy the previous image tag

## Database Migrations

Migrations are applied as part of the deploy pipeline using \`prisma migrate deploy\`. Migrations must be backward-compatible — avoid dropping columns in the same release that removes the code using them.

## Monitoring

After each deploy, check:
- Health endpoint: \`GET /health\` returns 200
- Error rates in the logging dashboard
- API response times in the metrics dashboard`,
    },
    {
      kb: 'Engineering Handbook',
      title: 'Incident Response Playbook',
      content: `# Incident Response Playbook

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| SEV-1 | Complete service outage, data loss risk | 15 minutes |
| SEV-2 | Major feature broken, significant user impact | 1 hour |
| SEV-3 | Minor feature degraded, workaround available | 4 hours |
| SEV-4 | Cosmetic issue, low impact | Next business day |

## On-Call Rotation

Engineers rotate on-call weekly (Monday to Monday). The on-call schedule is managed in PagerDuty. During on-call weeks:
- Keep your phone notifications enabled for PagerDuty
- Acknowledge alerts within 5 minutes
- Escalate if you can't resolve within the response window

## Incident Workflow

### 1. Detection
Incidents are detected via:
- Automated monitoring alerts (uptime, error rate spikes, latency)
- User reports via support channels
- Team members noticing issues

### 2. Triage
- Acknowledge the alert
- Assess severity using the table above
- Create a Slack thread in #incidents with: what's broken, severity, who's investigating

### 3. Mitigation
- Focus on restoring service, not finding root cause
- Common quick fixes: restart containers, rollback deployment, scale up resources
- Communicate status updates every 15 minutes for SEV-1/2

### 4. Resolution
- Confirm the issue is resolved
- Update the Slack thread with resolution summary
- Mark the incident as resolved in PagerDuty

### 5. Postmortem
Within 48 hours of a SEV-1 or SEV-2 incident, write a postmortem:
- Timeline of events
- Root cause analysis (use 5 Whys)
- What went well
- What could be improved
- Action items with owners and deadlines

## Communication Templates

**Initial notification:**
> 🚨 [SEV-X] <Brief description>. Investigating. Updates in this thread.

**Update:**
> 🔄 [SEV-X] Update: <What we know, what we're doing>. Next update in 15 min.

**Resolution:**
> ✅ [SEV-X] Resolved: <What happened, what fixed it>. Postmortem to follow.

## Escalation Path

1. On-call engineer
2. Tech lead
3. Engineering manager
4. CTO (SEV-1 only)`,
    },

    // Product Design Guidelines (2 docs)
    {
      kb: 'Product Design Guidelines',
      title: 'Design System Principles',
      content: `# Design System Principles

## Core Philosophy

KnowHive's design system prioritizes clarity, consistency, and speed. Every interface should feel familiar to users who have used one part of the product.

## Color Palette

Our primary color is teal (\`#0f766e\`) — chosen to feel calm, professional, and distinct from typical blue SaaS products. Amber (\`#d97706\`) serves as an accent for calls to action and highlights.

### Semantic Colors
- **Success:** Green \`#16a34a\` — confirmations, completed states
- **Warning:** Amber \`#d97706\` — caution, pending states
- **Error:** Red \`#dc2626\` — errors, destructive actions
- **Info:** Blue \`#2563eb\` — informational messages

### Dark Mode
The system supports class-based dark mode with automatic system preference detection. All components must render correctly in both modes. Use CSS custom properties for theme-aware colors.

## Typography

- **Headings:** Inter, semi-bold (600)
- **Body:** Inter, regular (400)
- **Mono:** JetBrains Mono — for code blocks and IDs
- Base size: 16px with a 1.5 line height for body text

## Spacing

Use a 4px grid. Common spacing values: 4, 8, 12, 16, 24, 32, 48, 64px. Never use arbitrary values — always snap to the grid.

## Components

All components live in \`src/components/\` and follow these conventions:
- One component per file
- Props interface defined above the component
- Default to accessible markup (semantic HTML, ARIA labels)
- Support both light and dark modes out of the box

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Navigation collapses to a hamburger menu below md
- Cards stack vertically on mobile, grid on desktop`,
    },
    {
      kb: 'Product Design Guidelines',
      title: 'Accessibility Standards',
      content: `# Accessibility Standards

## Commitment

KnowHive is committed to WCAG 2.1 Level AA compliance. Accessibility is not an afterthought — it is a requirement for every feature we ship.

## Keyboard Navigation

- All interactive elements must be reachable via Tab
- Focus order must follow visual layout (logical tab sequence)
- Focus indicators must be clearly visible (2px solid outline, offset by 2px)
- Modals and dropdowns must trap focus while open
- Escape key must close modals, dropdowns, and popovers

## Color Contrast

- Body text on backgrounds must meet a 4.5:1 contrast ratio minimum
- Large text (18px+ bold or 24px+ normal) requires 3:1 minimum
- Interactive elements (links, buttons) must have 3:1 contrast against adjacent colors
- Never use color alone to convey information — pair with icons or text

## Screen Readers

- All images must have descriptive \`alt\` text (or \`alt=""\` for decorative images)
- Form fields must have associated \`<label>\` elements or \`aria-label\`
- Dynamic content updates must use \`aria-live\` regions
- Page headings must follow a logical h1 → h2 → h3 hierarchy
- Use landmark roles: \`<main>\`, \`<nav>\`, \`<aside>\`

## Forms

- Validation errors must be associated with the input via \`aria-describedby\`
- Required fields must be marked with both visual indicator and \`aria-required\`
- Error messages must be announced to screen readers immediately
- Submit buttons must have clear labels ("Create Document" not just "Submit")

## Testing

- Test with keyboard-only navigation regularly
- Run Lighthouse accessibility audits (target score: 95+)
- Test with a screen reader (VoiceOver on macOS, NVDA on Windows) at least once per major feature
- Use axe DevTools browser extension during development`,
    },

    // Company Policies (2 docs)
    {
      kb: 'Company Policies',
      title: 'Remote Work Policy',
      content: `# Remote Work Policy

## Overview

KnowHive is a remote-first company. Team members can work from anywhere, provided they maintain reliable internet access and overlap with core collaboration hours.

## Core Hours

Everyone must be available from **10:00 AM to 2:00 PM** in their declared timezone. Outside core hours, work asynchronously — no one is expected to respond immediately to messages.

## Communication

- **Slack** is the primary communication tool. Keep conversations in public channels when possible.
- **Email** is for external communication and formal announcements.
- **Video calls** should have an agenda shared at least 30 minutes before the meeting. Cameras are encouraged but optional.

## Meetings

- Default meeting length is 25 minutes (not 30) or 50 minutes (not 60) to allow breaks
- All meetings must have a written agenda
- Meetings must produce written notes or action items posted to the relevant Slack channel
- No meeting Wednesdays — protect deep work time

## Equipment

The company provides a one-time $1,500 home office stipend for:
- Desk and chair
- Monitor
- Keyboard, mouse, peripherals
- Webcam and headset

## Performance

Remote work is evaluated on output, not hours logged. Managers set clear goals and deliverables. Status updates happen in weekly 1:1s and async standups on Slack.

## Time Off

Use the PTO system to log time off. Give at least 2 weeks notice for planned absences longer than 3 days. No approval needed for single days — just notify your team in Slack.`,
    },
    {
      kb: 'Company Policies',
      title: 'Data Security Policy',
      content: `# Data Security Policy

## Purpose

This policy defines how KnowHive handles, stores, and protects sensitive data. All team members must follow these guidelines.

## Data Classification

| Level | Description | Examples |
|-------|-------------|----------|
| Public | Freely shareable | Marketing content, public docs |
| Internal | Company eyes only | Internal wikis, meeting notes |
| Confidential | Restricted access | Customer data, API keys, financials |
| Secret | Need-to-know basis | Encryption keys, auth secrets |

## Password Requirements

- Minimum 12 characters
- Must include uppercase, lowercase, number, and special character
- Unique per service (no password reuse)
- Use a company-approved password manager (1Password)
- Enable MFA on all accounts that support it

## Access Control

- Follow the principle of least privilege
- Access to production systems requires manager approval
- Service accounts must use API keys, not personal credentials
- Revoke access within 24 hours when someone leaves the team
- Review access permissions quarterly

## Data Storage

- Customer data must be encrypted at rest (AES-256) and in transit (TLS 1.2+)
- Never store secrets in source code — use environment variables
- Database backups are encrypted and retained for 30 days
- Logs must not contain passwords, tokens, or PII

## Incident Reporting

If you suspect a data breach or security incident:
1. Do not attempt to investigate or fix it yourself
2. Report immediately to the #security Slack channel
3. Contact the security lead directly if the channel is unresponsive
4. Preserve evidence — do not delete logs or modify systems

## Approved Tools

Only use company-approved tools for sensitive data:
- **Code:** GitHub (private repositories)
- **Communication:** Slack (Enterprise Grid)
- **Documents:** Notion (company workspace)
- **Passwords:** 1Password (Teams)
- **Cloud:** AWS (designated accounts only)`,
    },

    // Onboarding Guide (2 docs)
    {
      kb: 'Onboarding Guide',
      title: 'Developer Setup Guide',
      content: `# Developer Setup Guide

## Welcome!

This guide will help you set up your local development environment for KnowHive. You should be able to run the full stack within 30 minutes.

## Prerequisites

- **Node.js** 20 or later (use nvm to manage versions)
- **Docker** and Docker Compose (for PostgreSQL with pgvector)
- **Git** configured with your GitHub account
- **VS Code** recommended with extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense

## Step 1: Clone and Install

\`\`\`bash
git clone https://github.com/knowhive/knowhive.git
cd knowhive

# Install API dependencies
cd apps/api
npm install

# Install Web dependencies
cd ../web
npm install
\`\`\`

## Step 2: Environment Variables

Copy the example env file and fill in the values:

\`\`\`bash
cp .env.example .env
\`\`\`

Key variables:
- \`DATABASE_URL\` — typically \`postgresql://knowhive:knowhive_password@localhost:5432/knowhive\`
- \`JWT_SECRET\` — any secure random string for local dev
- \`OPENAI_API_KEY\` — get a key from platform.openai.com (optional for basic dev)

## Step 3: Start the Database

\`\`\`bash
docker compose up postgres -d
\`\`\`

This starts PostgreSQL with pgvector on port 5432.

## Step 4: Run Migrations

\`\`\`bash
cd apps/api
npx prisma migrate dev
\`\`\`

## Step 5: Start the API

\`\`\`bash
cd apps/api
npm run start:dev
\`\`\`

Verify: \`curl http://localhost:3001/health\` should return \`{"status":"ok"}\`

## Step 6: Start the Frontend

\`\`\`bash
cd apps/web
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

## Troubleshooting

- **Port 5432 in use:** Stop any local PostgreSQL instances
- **Prisma errors:** Run \`npx prisma generate\` to regenerate the client
- **Node version:** Check with \`node -v\` — must be 20+
- **Docker not running:** Ensure Docker Desktop is started`,
    },
    {
      kb: 'Onboarding Guide',
      title: 'Team Communication Channels',
      content: `# Team Communication Channels

## Slack Workspace

Slack is our primary communication tool. Here are the key channels every team member should join:

### General Channels
- **#general** — Company-wide announcements and discussions
- **#random** — Water cooler chat, memes, and off-topic fun
- **#introductions** — Post a short intro when you join the team

### Engineering Channels
- **#engineering** — Technical discussions, architecture decisions, RFC reviews
- **#deployments** — Automated deploy notifications and manual deploy announcements
- **#incidents** — Active incident communication (see Incident Response Playbook)
- **#code-review** — Request reviews and share interesting patterns
- **#dev-environment** — Help with local setup issues

### Product Channels
- **#product** — Feature discussions, roadmap updates, user feedback
- **#design** — UI/UX proposals, design reviews, component updates

### Process Channels
- **#standups** — Async daily standups (post by 10:30 AM your time)
- **#til** — Today I Learned — share interesting discoveries
- **#kudos** — Recognize great work by teammates

## Meetings

| Meeting | Cadence | Duration | Required |
|---------|---------|----------|----------|
| Daily standup | Async on Slack | — | All engineers |
| Sprint planning | Biweekly Monday | 50 min | All engineers |
| Retrospective | Biweekly Friday | 50 min | All engineers |
| 1:1 with manager | Weekly | 25 min | Individual |
| Tech talk | Monthly | 50 min | Optional |
| All-hands | Monthly | 50 min | Everyone |

## Getting Help

1. Search Slack history and KnowHive docs first
2. Ask in the relevant channel (not DMs — others may benefit from the answer)
3. If urgent, mention the person directly with \`@name\`
4. For on-call issues, follow the Incident Response Playbook

## Response Times

- **Core hours messages:** Respond within 2 hours
- **Async messages:** Respond within 1 business day
- **DMs from your manager:** Respond within 4 hours
- **#incidents:** Respond immediately if you're on-call`,
    },
  ];

  if (!openai) {
    console.log('⚠️  OPENAI_API_KEY not set. Chunks will be created without embeddings.');
    console.log('   Search will not work until embeddings are generated.\n');
  } else {
    console.log('🔑 OpenAI API key detected. Generating embeddings for chunks.\n');
  }

  for (const doc of documents) {
    const kbId = knowledgeBases[doc.kb];
    const created = await prisma.document.create({
      data: {
        title: doc.title,
        content: doc.content,
        status: 'READY',
        knowledgeBaseId: kbId,
        createdById: user.id,
      },
    });

    const chunks = splitText(doc.content);

    if (openai) {
      const sanitized = chunks.map((c) => c.replace(/\n/g, ' '));
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: sanitized,
      });
      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);

      for (let i = 0; i < chunks.length; i++) {
        const vectorLiteral = `[${embeddings[i].join(',')}]`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO document_chunks (id, content, index, embedding, "documentId")
           VALUES (gen_random_uuid(), $1, $2, $3::vector, $4)`,
          chunks[i],
          i,
          vectorLiteral,
          created.id,
        );
      }
    } else {
      for (let i = 0; i < chunks.length; i++) {
        await prisma.documentChunk.create({
          data: {
            content: chunks[i],
            index: i,
            documentId: created.id,
          },
        });
      }
    }

    console.log(
      `✅ Document created: "${doc.title}" (${chunks.length} chunks)`,
    );
  }

  console.log('\n🎉 Seed complete!');
  console.log('────────────────────────────────────');
  console.log('Demo account credentials:');
  console.log('  Email:    demo@knowhive.dev');
  console.log('  Password: Demo@1234');
  console.log('────────────────────────────────────');
}

function splitText(text: string): string[] {
  const CHUNK_SIZE = 500;
  const CHUNK_OVERLAP = 50;
  const chunks: string[] = [];

  if (text.length <= CHUNK_SIZE) {
    return [text];
  }

  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    if (end >= text.length) {
      chunks.push(text.slice(start));
      break;
    }

    const lastNewline = text.lastIndexOf('\n', end);
    if (lastNewline > start + CHUNK_SIZE / 2) {
      end = lastNewline;
    }

    chunks.push(text.slice(start, end));
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
