'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { knowledgeBases, documents, type KnowledgeBase, type Document } from '@/lib/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { Plus, FileText, Search, ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  PENDING: { icon: Clock, label: 'Pending', color: 'text-warning' },
  PROCESSING: { icon: Loader2, label: 'Processing', color: 'text-accent' },
  READY: { icon: CheckCircle2, label: 'Ready', color: 'text-success' },
  FAILED: { icon: XCircle, label: 'Failed', color: 'text-danger' },
};

export default function KnowledgeBaseDetailPage() {
  const { slug, kbId } = useParams<{ slug: string; kbId: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token || !slug || !kbId) return;
    Promise.all([
      knowledgeBases.get(token, slug, kbId),
      documents.list(token, slug, kbId),
    ]).then(([kbData, docData]) => {
      setKb(kbData);
      setDocs(docData);
    }).finally(() => setLoading(false));
  }, [token, slug, kbId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !slug || !kbId || !newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    const doc = await documents.create(token, slug, kbId, {
      title: newTitle.trim(),
      content: newContent.trim(),
    });
    setDocs((prev) => [...prev, doc]);
    setNewTitle('');
    setNewContent('');
    setShowCreate(false);
    setCreating(false);
  }

  if (loading) return <Spinner className="py-24" />;
  if (!kb) return <p className="py-24 text-center text-secondary">Knowledge base not found.</p>;

  return (
    <>
      <div className="mb-2">
        <Link
          href={`/dashboard/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Bases
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{kb.name}</h1>
          {kb.description && <p className="mt-1 text-sm text-secondary">{kb.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push(`/dashboard/${slug}/${kbId}/search`)}
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-24">
          <FileText className="h-12 w-12 text-secondary/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No documents yet</h3>
          <p className="mt-2 text-sm text-secondary">Add your first document to start building your knowledge base.</p>
          <Button className="mt-6" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => {
            const status = statusConfig[doc.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            return (
              <Card key={doc.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate">{doc.title}</CardTitle>
                  {doc.content && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {doc.content.substring(0, 200)}
                      {doc.content.length > 200 ? '...' : ''}
                    </CardDescription>
                  )}
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${status.color} ${doc.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                  <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Document">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Getting Started Guide"
            required
            autoFocus
          />
          <div className="w-full">
            <label htmlFor="doc-content" className="mb-1 block text-sm font-medium text-foreground">
              Content
            </label>
            <textarea
              id="doc-content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Paste your document content here..."
              required
              rows={8}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm transition-colors placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Add Document
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
