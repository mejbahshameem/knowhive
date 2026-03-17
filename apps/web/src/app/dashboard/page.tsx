'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { organizations, type Organization } from '@/lib/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Building2, BookOpen, Users } from 'lucide-react';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    organizations.list(token).then(setOrgs).finally(() => setLoading(false));
  }, [token]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setCreating(true);
    const org = await organizations.create(token, { name: newName.trim() });
    setOrgs((prev) => [...prev, org]);
    setNewName('');
    setShowCreate(false);
    setCreating(false);
  }

  if (loading) return <Spinner className="py-24" />;

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Manage your organizations and knowledge bases
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-24">
          <Building2 className="h-12 w-12 text-secondary/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No organizations yet</h3>
          <p className="mt-2 text-sm text-secondary">Create your first organization to get started.</p>
          <Button className="mt-6" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card
              key={org.id}
              hover
              onClick={() => router.push(`/dashboard/${org.slug}`)}
            >
              <div className="mb-3 inline-flex rounded-lg bg-accent-light p-2.5">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription className="mt-1">/{org.slug}</CardDescription>
              <div className="mt-4 flex items-center gap-4 text-xs text-secondary">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {org._count?.knowledgeBases ?? 0} knowledge bases
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {org._count?.members ?? 0} members
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Organization">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Organization Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="My Team"
            required
            autoFocus
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
