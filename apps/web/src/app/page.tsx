'use client';

import Link from 'next/link';
import { Hexagon, Search, Shield, Layers, Zap, Users, FileText, Sparkles, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/auth-context';

const features = [
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Ask questions in plain language and get precise answers pulled from your entire document library.',
    span: 'sm:col-span-2',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'JWT authentication, bcrypt password hashing, rate limiting, and input validation out of the box.',
    span: '',
  },
  {
    icon: Layers,
    title: 'Multi-Tenant Architecture',
    description: 'Organize teams into isolated organizations, each with their own knowledge bases and role based access control.',
    span: '',
  },
  {
    icon: Zap,
    title: 'Async Processing',
    description: 'Documents are automatically chunked and embedded in the background. No waiting, no manual steps.',
    span: '',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite members, assign roles, and share knowledge bases across your entire organization.',
    span: '',
  },
  {
    icon: Sparkles,
    title: 'OpenAI Embeddings',
    description: 'Powered by text-embedding-3-small with pgvector for sub-second similarity search across millions of chunks.',
    span: 'sm:col-span-2',
  },
];

const steps = [
  {
    icon: Upload,
    title: 'Upload documents',
    description: 'Add your team documentation, guides, runbooks, or any text content to a knowledge base.',
  },
  {
    icon: Zap,
    title: 'AI processes everything',
    description: 'Each document is split into chunks and converted into vector embeddings automatically.',
  },
  {
    icon: Search,
    title: 'Search naturally',
    description: 'Ask questions in plain English. The system finds the most relevant content and ranks it by similarity.',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Hexagon className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">KnowHive</span>
          </div>
          {!loading && (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-20 pb-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:pt-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI Powered Knowledge Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your team&apos;s knowledge,{' '}
            <span className="text-primary">instantly searchable</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-secondary leading-relaxed">
            Upload your documents, ask questions in natural language, and get precise answers in seconds.
            Built for teams that need fast, reliable access to internal knowledge.
          </p>
          <div className="mt-10 flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">Sign In</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Product preview mockup */}
        <div className="relative hidden lg:block">
          <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <span className="ml-2 text-xs text-secondary">Semantic Search</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 bg-muted/50">
                <Search className="h-4 w-4 text-secondary" />
                <span className="text-sm text-foreground">How do I deploy to production?</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Deployment Guide</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-success" style={{ width: '94%' }} />
                      </div>
                      <span className="text-xs text-secondary">94%</span>
                    </div>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Build the Docker image using the production Dockerfile, then push to your container registry...
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 opacity-70">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">CI/CD Pipeline Setup</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: '78%' }} />
                      </div>
                      <span className="text-xs text-secondary">78%</span>
                    </div>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    The GitHub Actions workflow handles automated testing and deployment to staging...
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 -top-10 -right-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -z-10 -bottom-10 -left-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-muted/50 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm font-medium text-secondary sm:px-6">
          <span>Semantic Vector Search</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>Role Based Access Control</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>Automatic Document Processing</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>RESTful API</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>Container Ready</span>
        </div>
      </section>

      {/* Features bento grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-bold text-foreground">
              Built for real teams with real documents
            </h2>
            <p className="mt-4 text-lg text-secondary">
              Everything you need to centralize knowledge, keep it current, and make it instantly accessible.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30 ${feature.span}`}
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary-light p-3 transition-colors group-hover:bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Three steps to searchable knowledge
            </h2>
            <p className="mt-4 text-lg text-secondary">
              From zero to searchable in minutes.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="relative text-center">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-xl bg-primary-light p-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary-light border border-primary/20 px-8 py-16 text-center sm:px-16">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to centralize your knowledge?
            </h2>
            <p className="mt-4 text-lg text-secondary">
              Create your account and set up your first knowledge base in under two minutes.
            </p>
            <div className="mt-8">
              <Link href={user ? '/dashboard' : '/register'}>
                <Button size="lg">
                  {user ? 'Go to Dashboard' : 'Create Free Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Hexagon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">KnowHive</span>
            </div>
            <p className="text-sm text-secondary">
              Built with NestJS, Next.js, and OpenAI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
