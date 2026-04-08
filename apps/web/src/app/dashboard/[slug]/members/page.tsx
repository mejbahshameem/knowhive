'use client';

import { useEffect, useState, useRef, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { members, organizations, type OrgMember, type Organization, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  User,
  UserPlus,
  Trash2,
  ChevronDown,
} from 'lucide-react';

const roleConfig: Record<string, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  OWNER: { label: 'Owner', icon: Crown, color: 'text-accent', bg: 'bg-accent-light' },
  ADMIN: { label: 'Admin', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary-light' },
  MEMBER: { label: 'Member', icon: User, color: 'text-secondary', bg: 'bg-muted' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token, user } = useAuth();

  const [org, setOrg] = useState<Organization | null>(null);
  const [memberList, setMemberList] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('MEMBER');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [showRemove, setShowRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setRoleMenuOpen(null), []);

  useEffect(() => {
    if (!roleMenuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [roleMenuOpen, closeMenu]);

  function openRoleMenu(memberId: string, buttonEl: HTMLButtonElement) {
    if (roleMenuOpen === memberId) {
      setRoleMenuOpen(null);
      return;
    }
    const rect = buttonEl.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
    setRoleMenuOpen(memberId);
  }

  const currentMembership = memberList.find((m) => m.user.id === user?.id);
  const canManage = currentMembership?.role === 'OWNER' || currentMembership?.role === 'ADMIN';

  useEffect(() => {
    if (!token || !slug) return;
    Promise.all([
      organizations.get(token, slug),
      members.list(token, slug),
    ])
      .then(([orgData, memberData]) => {
        setOrg(orgData);
        setMemberList(memberData);
      })
      .catch(() => setError('Failed to load members'))
      .finally(() => setLoading(false));
  }, [token, slug]);

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!token || !slug || !addEmail.trim()) return;
    setAdding(true);
    setAddError('');

    try {
      const newMember = await members.add(token, slug, {
        email: addEmail.trim(),
        role: addRole,
      });
      setMemberList((prev) => [...prev, newMember]);
      setAddEmail('');
      setAddRole('MEMBER');
      setShowAdd(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setAddError(err.message);
      } else {
        setAddError('Something went wrong. Please try again.');
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!token || !slug) return;
    setRemoving(true);

    try {
      await members.remove(token, slug, memberId);
      setMemberList((prev) => prev.filter((m) => m.id !== memberId));
      setShowRemove(null);
    } catch {
      setError('Failed to remove member');
    } finally {
      setRemoving(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    if (!token || !slug) return;
    setUpdatingRole(memberId);
    setRoleMenuOpen(null);

    try {
      const updated = await members.updateRole(token, slug, memberId, { role: newRole });
      setMemberList((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: updated.role } : m)),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setUpdatingRole(null);
    }
  }

  function canChangeRole(target: OrgMember): boolean {
    if (!currentMembership) return false;
    if (target.role === 'OWNER') return false;
    if (target.user.id === user?.id) return false;
    if (currentMembership.role === 'OWNER') return true;
    if (currentMembership.role === 'ADMIN' && target.role === 'MEMBER') return true;
    return false;
  }

  function canRemoveMember(target: OrgMember): boolean {
    if (!currentMembership) return false;
    if (target.role === 'OWNER') return false;
    if (target.user.id === user?.id) return false;
    if (currentMembership.role === 'OWNER') return true;
    if (currentMembership.role === 'ADMIN' && target.role === 'MEMBER') return true;
    return false;
  }

  if (loading) return <Spinner className="py-24" />;

  if (error && !org) {
    return <p className="py-24 text-center text-secondary">{error}</p>;
  }

  const removingMember = memberList.find((m) => m.id === showRemove);

  return (
    <>
      <div className="mb-2">
        <Link
          href={`/dashboard/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {org?.name || 'Organization'}
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="mt-1 text-sm text-secondary">
            {memberList.length} member{memberList.length !== 1 ? 's' : ''} in {org?.name}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                Role
              </th>
              <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary sm:table-cell">
                Joined
              </th>
              {canManage && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {memberList.map((member) => {
              const config = roleConfig[member.role] || roleConfig.MEMBER;
              const RoleIcon = config.icon;
              const isCurrentUser = member.user.id === user?.id;

              return (
                <tr key={member.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-medium text-primary">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.user.name}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs text-secondary">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-secondary">{member.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block">
                      {canChangeRole(member) ? (
                        <button
                          onClick={(e) => openRoleMenu(member.id, e.currentTarget)}
                          disabled={updatingRole === member.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color} ${config.bg} transition-colors hover:opacity-80`}
                        >
                          <RoleIcon className="h-3.5 w-3.5" />
                          {updatingRole === member.id ? 'Updating...' : config.label}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color} ${config.bg}`}
                        >
                          <RoleIcon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-secondary sm:table-cell">
                    {member.joinedAt ? formatDate(member.joinedAt) : ''}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      {canRemoveMember(member) && (
                        <button
                          onClick={() => setShowRemove(member.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role change dropdown (fixed position, renders above overflow) */}
      {roleMenuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 w-36 rounded-lg border border-border bg-card py-1 shadow-lg"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {['ADMIN', 'MEMBER']
            .filter((r) => {
              const m = memberList.find((m) => m.id === roleMenuOpen);
              return m ? r !== m.role : true;
            })
            .map((role) => {
              const rc = roleConfig[role];
              const Icon = rc.icon;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleChange(roleMenuOpen, role)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Icon className={`h-3.5 w-3.5 ${rc.color}`} />
                  {rc.label}
                </button>
              );
            })}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddError(''); }} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            autoFocus
            error={addError}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Role</label>
            <div className="flex gap-3">
              {(['MEMBER', 'ADMIN'] as const).map((role) => {
                const rc = roleConfig[role];
                const Icon = rc.icon;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setAddRole(role)}
                    className={`flex flex-1 items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      addRole === role
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-border text-secondary hover:border-primary/30'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {rc.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => { setShowAdd(false); setAddError(''); }}>
              Cancel
            </Button>
            <Button type="submit" loading={adding}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        open={showRemove !== null}
        onClose={() => setShowRemove(null)}
        title="Remove Member"
      >
        <p className="mb-6 text-sm text-secondary">
          Are you sure you want to remove{' '}
          <span className="font-medium text-foreground">
            {removingMember?.user.name}
          </span>{' '}
          from this organization? They will lose access to all knowledge bases and documents.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowRemove(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={removing}
            onClick={() => showRemove && handleRemoveMember(showRemove)}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </>
  );
}
