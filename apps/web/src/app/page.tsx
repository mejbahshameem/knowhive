import Link from 'next/link';
import { Brain, Search, Shield, Layers, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Find answers instantly with AI-powered semantic search across your entire knowledge base.',
  },
  {
    icon: Layers,
    title: 'Multi-Tenant Architecture',
    description: 'Organize knowledge by teams with full organization and role-based access control.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'JWT authentication, bcrypt hashing, rate limiting, and input validation built in.',
  },
  {
    icon: Zap,
    title: 'Async Processing',
    description: 'Documents are chunked and embedded automatically in the background, ready when you are.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite members, assign roles, and share knowledge bases across your organization.',
  },
  {
    icon: Brain,
    title: 'OpenAI Embeddings',
    description: 'Powered by text-embedding-3-small with pgvector for blazing-fast similarity search.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">AtlasAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 pb-16 text-center sm:px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-light bg-primary-light/50 px-4 py-1.5 text-sm font-medium text-primary">
          <Zap className="h-4 w-4" />
          AI-Powered Knowledge Management
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Your team&apos;s knowledge,{' '}
          <span className="text-primary">instantly searchable</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-secondary">
          AtlasAI transforms your documents into a searchable, AI-powered knowledge base.
          Upload content, ask questions in natural language, and get precise answers in seconds.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link href="/register">
            <Button size="lg">Start Free</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Everything you need to manage knowledge
            </h2>
            <p className="mt-4 text-lg text-secondary">
              Built with a modern stack using NestJS, PostgreSQL, pgvector, and OpenAI for production-grade performance.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary-light p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
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

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-foreground">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-secondary">
            Create your account and set up your first knowledge base in minutes.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg">Create Free Account</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">AtlasAI</span>
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
