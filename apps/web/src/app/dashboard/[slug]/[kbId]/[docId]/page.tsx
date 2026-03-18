'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { documents, type Document } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Pencil,
  Trash2,
  FileText,
  Calendar,
  RefreshCw,
  User,
} from 'lucide-react';

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string; bg: string }> = {
  PENDING:    { icon: Clock,        label: 'Pending',    color: 'text-warning', bg: 'bg-warning/10' },
  PROCESSING: { icon: Loader2,      label: 'Processing', color: 'text-accent',  bg: 'bg-accent/10' },
  READY:      { icon: CheckCircle2, label: 'Ready',      color: 'text-success', bg: 'bg-success/10' },
  FAILED:     { icon: XCircle,      label: 'Failed',     color: 'text-danger',  bg: 'bg-danger/10' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function DocumentDetailPage() {
  const { slug, kbId, docId } = useParams<{ slug: string; kbId: string; docId: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!token || !slug || !kbId || !docId) return;
    try {
      const data = await documents.get(token, slug, kbId, docId);
      setDoc(data);
    } catch {
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [token, slug, kbId, docId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  function startEditing() {
    if (!doc) return;
    setEditTitle(doc.title);
    setEditContent(doc.content || '');
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditTitle('');
    setEditContent('');
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !slug || !kbId || !docId) return;
    setSaving(true);
    try {
      const updated = await documents.update(token, slug, kbId, docId, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setDoc(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!token || !slug || !kbId || !docId) return;
    setDeleting(true);
    try {
      await documents.remove(token, slug, kbId, docId);
      router.push(`/dashboard/${slug}/${kbId}`);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Spinner className="py-24" />;
  if (!doc) return <p className="py-24 text-center text-secondary">Document not found.</p>;

  const status = statusConfig[doc.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/dashboard/${slug}/${kbId}`}
          className="inline-flex items-center gap-1 text-sm text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
      </div>

      {editing ? (
        /* ── Edit Mode ── */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Edit Document</h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" type="button" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>

          <Input
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label htmlFor="edit-content" className="mb-1.5 block text-sm font-medium text-foreground">
              Content
            </label>
            <textarea
              id="edit-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
              rows={20}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed transition-colors placeholder:text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono"
            />
            <p className="mt-1.5 text-xs text-secondary">
              {wordCount(editContent)} words &middot; {editContent.length} characters
            </p>
          </div>
        </form>
      ) : (
        /* ── Read Mode ── */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-primary-light p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.color} ${status.bg}`}>
                  <StatusIcon className={`h-3.5 w-3.5 ${doc.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                  {status.label}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {doc.title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-secondary">
            {doc.createdBy && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {doc.createdBy.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Created {formatDate(doc.createdAt)}
            </span>
            {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Updated {formatDate(doc.updatedAt)}
              </span>
            )}
            {doc.content && (
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {wordCount(doc.content)} words
              </span>
            )}
          </div>

          {/* Document content */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-3">
              <span className="text-xs font-medium text-secondary uppercase tracking-wide">Document Content</span>
            </div>
            <div className="px-6 py-5">
              {doc.content ? (
                <div className="prose-sm max-w-none">
                  {doc.content.split('\n').map((paragraph, i) => (
                    paragraph.trim() ? (
                      <p key={i} className="mb-3 text-sm leading-relaxed text-foreground/90 last:mb-0">
                        {paragraph}
                      </p>
                    ) : (
                      <div key={i} className="h-3" />
                    )
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary italic">No content available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Document">
        <p className="text-sm text-secondary">
          Are you sure you want to delete <strong className="text-foreground">{doc.title}</strong>?
          This will permanently remove the document and all its embeddings. This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete Document
          </Button>
        </div>
      </Modal>
    </>
  );
}
