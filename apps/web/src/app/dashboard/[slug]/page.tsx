'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { organizations, knowledgeBases, type Organization, type KnowledgeBase } from '@/lib/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { Plus, BookOpen, FileText, ChevronRight, ArrowLeft, Users } from 'lucide-react';

export default function OrgDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [org, setOrg] = useState<Organization | null>(null);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token || !slug) return;
    Promise.all([
      organizations.get(token, slug),
      knowledgeBases.list(token, slug),
    ]).then(([orgData, kbData]) => {
      setOrg(orgData);
      setKbs(kbData);
    }).finally(() => setLoading(false));
  }, [token, slug]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !slug || !newName.trim()) return;
    setCreating(true);
    const kb = await knowledgeBases.create(token, slug, {
      name: newName.trim(),
      description: newDesc.trim() || undefined,
    });
    setKbs((prev) => [...prev, kb]);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    setCreating(false);
  }

  if (loading) return <Spinner className="py-24" />;
  if (!org) return <p className="py-24 text-center text-secondary">Organization not found.</p>;

  return (
    <>
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Organizations
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
          <p className="mt-1 text-sm text-secondary">/{org.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/${slug}/members`}>
            <Button variant="secondary" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Members
            </Button>
          </Link>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Knowledge Base
          </Button>
        </div>
      </div>

      {kbs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-24">
          <BookOpen className="h-12 w-12 text-secondary/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No knowledge bases yet</h3>
          <p className="mt-2 text-sm text-secondary">Create your first knowledge base to start adding documents.</p>
          <Button className="mt-6" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Knowledge Base
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kbs.map((kb) => (
            <Card
              key={kb.id}
              hover
              onClick={() => router.push(`/dashboard/${slug}/${kb.id}`)}
            >
              <div className="mb-3 inline-flex rounded-lg bg-primary-light p-2.5">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>{kb.name}</CardTitle>
              {kb.description && (
                <CardDescription className="mt-1">{kb.description}</CardDescription>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-secondary">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {kb._count?.documents ?? 0} documents
                </span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Knowledge Base">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Engineering Docs"
            required
            autoFocus
          />
          <Input
            label="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Internal engineering documentation and guides"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
