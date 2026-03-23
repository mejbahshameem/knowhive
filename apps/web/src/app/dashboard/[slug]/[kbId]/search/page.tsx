'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { search, type SearchResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Search, ArrowLeft, FileText, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const { slug, kbId } = useParams<{ slug: string; kbId: string }>();
  const { token } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!token || !slug || !kbId || !query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const data = await search.query(token, slug, kbId, { query: query.trim(), limit: 10 });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function getRelevanceColor(score: number): string {
    if (score >= 0.8) return 'bg-success';
    if (score >= 0.6) return 'bg-accent';
    if (score >= 0.4) return 'bg-warning';
    return 'bg-secondary';
  }

  return (
    <>
      <div className="mb-2">
        <Link
          href={`/dashboard/${slug}/${kbId}`}
          className="inline-flex items-center gap-1 text-sm text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Semantic Search</h1>
        <p className="mt-1 text-sm text-secondary">
          Ask questions in natural language and find relevant content across your documents.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="How do I set up the development environment?"
              className="w-full rounded-lg border border-border py-3 pl-11 pr-4 text-sm transition-colors placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <Button type="submit" loading={loading} size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </form>

      {loading && <Spinner className="py-12" />}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16">
          <Search className="h-12 w-12 text-secondary/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No results found</h3>
          <p className="mt-2 text-sm text-secondary">Try rephrasing your question or adding more documents.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          {results.map((result, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {result.documentTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${getRelevanceColor(result.score)}`}
                      style={{ width: `${Math.round(result.score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-secondary">
                    {Math.round(result.score * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                {result.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
