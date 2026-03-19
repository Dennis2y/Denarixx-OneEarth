import React, { useEffect, useState } from 'react';
import { PageHeader, Card, Badge, Table, Th, Td, Button, Skeleton, Input, Label, cn } from '@/components/ui-core';
import { Shield, Mail, Activity, Lock, Plus, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '@/lib/api';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({
    name: '',
    email: '',
    role: 'operator',
    organization: '',
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const resp = await fetch(apiUrl('/api/users'), { credentials: 'include' });
        const data = resp.ok ? await resp.json() : [];
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setUsers([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const usersList = Array.isArray(users) ? users : [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary border-primary/30';
      case 'operator': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'family': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'government': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-border/50 text-muted-foreground';
    }
  };

  const getStatusDot = (status: string) => {
    if (status === 'active') return 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]';
    if (status === 'suspended') return 'bg-destructive';
    return 'bg-muted-foreground';
  };

  const resetGrantForm = () => {
    setGrantForm({
      name: '',
      email: '',
      role: 'operator',
      organization: '',
    });
  };

  const handleGrantClearance = (e: React.FormEvent) => {
    e.preventDefault();

    const name = grantForm.name.trim();
    const email = grantForm.email.trim();
    const role = grantForm.role.trim();
    const organization = grantForm.organization.trim();

    if (!name || !email) return;

    const newUser = {
      id: Date.now(),
      name,
      email,
      role,
      organization: organization || 'Denarixx Command',
      status: 'active',
      lastLogin: new Date().toISOString(),
    };

    setUsers((current) => [newUser, ...current]);
    setIsGrantOpen(false);
    resetGrantForm();
  };

  return (
    <>
      {isGrantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xl font-display font-bold text-white">{t('users.grantClearance')}</div>
                <div className="mt-1 text-sm text-muted-foreground">Create a new clearance entry.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGrantOpen(false);
                  resetGrantForm();
                }}
                className="rounded-xl border border-border/60 bg-secondary/40 p-2 text-muted-foreground hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleGrantClearance}>
              <div className="space-y-2">
                <Label htmlFor="grant-name">Full Name</Label>
                <Input
                  id="grant-name"
                  value={grantForm.name}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Operator name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-email">Email</Label>
                <Input
                  id="grant-email"
                  type="email"
                  value={grantForm.email}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-role">Role</Label>
                <select
                  id="grant-role"
                  value={grantForm.role}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="admin">admin</option>
                  <option value="operator">operator</option>
                  <option value="government">government</option>
                  <option value="family">family</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-organization">Organization</Label>
                <Input
                  id="grant-organization"
                  value={grantForm.organization}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, organization: e.target.value }))}
                  placeholder="Organization"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setIsGrantOpen(false);
                    resetGrantForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Grant
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        actions={
          <Button
            className="shadow-[0_0_15px_rgba(201,168,76,0.2)]"
            onClick={() => setIsGrantOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> {t('users.grantClearance')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card className="p-5 bg-secondary/30 border-l-4 border-l-primary flex items-center">
          <Shield className="w-10 h-10 text-primary mr-4 opacity-50 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('users.adminLevel')}</p>
            <p className="text-2xl font-display font-bold text-white">{usersList.filter(u => u.role === 'admin').length}</p>
          </div>
        </Card>
        <Card className="p-5 bg-secondary/30 border-l-4 border-l-blue-500 flex items-center">
          <Activity className="w-10 h-10 text-blue-500 mr-4 opacity-50 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('users.activeOperators')}</p>
            <p className="text-2xl font-display font-bold text-white">{usersList.filter(u => u.status === 'active').length}</p>
          </div>
        </Card>
        <Card className="p-5 bg-secondary/30 border-l-4 border-l-destructive flex items-center">
          <Lock className="w-10 h-10 text-destructive mr-4 opacity-50 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('users.suspendedAccounts')}</p>
            <p className="text-2xl font-display font-bold text-white">{usersList.filter(u => u.status === 'suspended').length}</p>
          </div>
        </Card>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="sm:hidden divide-y divide-border/50">
              {usersList.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-display font-bold shrink-0">
                      {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 opacity-50 shrink-0" /> {user.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className={cn("w-2 h-2 rounded-full", getStatusDot(user.status))} />
                      <span className={cn("text-xs font-semibold capitalize", user.status === 'active' ? 'text-white' : 'text-muted-foreground')}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("uppercase text-[10px] font-bold tracking-widest border", getRoleColor(user.role))}>
                      {user.role}
                    </Badge>
                    {user.organization && <span className="text-xs text-muted-foreground">{user.organization}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : t('users.never')}
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs h-7 hover:bg-destructive/10 hover:text-destructive">
                      {t('users.revokeAccess')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block">
              <Table>
                <thead>
                  <tr>
                    <Th>{t('users.colDesignation')}</Th>
                    <Th>{t('users.colRole')}</Th>
                    <Th className="hidden lg:table-cell">{t('users.colOrganization')}</Th>
                    <Th>{t('users.colStatus')}</Th>
                    <Th className="hidden md:table-cell">{t('users.colLastUplink')}</Th>
                    <Th className="text-right">{t('users.colActions')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/40 transition-colors group">
                      <Td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-display font-bold mr-4 shadow-inner shrink-0">
                            {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-primary transition-colors">{user.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              <Mail className="w-3 h-3 mr-1 opacity-50" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant="outline" className={cn("uppercase text-[10px] font-bold tracking-widest border", getRoleColor(user.role))}>
                          {user.role}
                        </Badge>
                      </Td>
                      <Td className="text-sm font-medium text-foreground hidden lg:table-cell">{user.organization}</Td>
                      <Td>
                        <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                          <div className={cn("w-2 h-2 rounded-full mr-2 shrink-0", getStatusDot(user.status))} />
                          <span className={user.status === 'active' ? 'text-white' : 'text-muted-foreground'}>{user.status}</span>
                        </div>
                      </Td>
                      <Td className="text-sm text-muted-foreground font-mono hidden md:table-cell">
                        {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : t('users.never')}
                      </Td>
                      <Td className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs font-medium hover:bg-destructive/10 hover:text-destructive">{t('users.revokeAccess')}</Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </motion.div>
    </>
  );
}
