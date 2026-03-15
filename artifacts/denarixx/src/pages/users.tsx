import React from 'react';
import { useGetUsers } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button, Skeleton, cn } from '@/components/ui-core';
import { Users as UsersIcon, Shield, Mail, Activity, Lock, Plus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Users() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useGetUsers();

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-primary/10 text-primary border-primary/30';
      case 'operator': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'family': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'government': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-border/50 text-muted-foreground';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title={t('users.title')}
        description={t('users.description')}
        actions={
          <Button className="shadow-[0_0_15px_rgba(201,168,76,0.2)]">
            <Plus className="w-4 h-4 mr-2" /> {t('users.grantClearance')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-secondary/30 border-l-4 border-l-primary flex items-center">
          <Shield className="w-10 h-10 text-primary mr-4 opacity-50" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('users.adminLevel')}</p>
            <p className="text-2xl font-display font-bold text-white">{users?.filter(u => u.role === 'admin').length || 0}</p>
          </div>
        </Card>
        <Card className="p-6 bg-secondary/30 border-l-4 border-l-blue-500 flex items-center">
          <Activity className="w-10 h-10 text-blue-500 mr-4 opacity-50" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('users.activeOperators')}</p>
            <p className="text-2xl font-display font-bold text-white">{users?.filter(u => u.status === 'active').length || 0}</p>
          </div>
        </Card>
        <Card className="p-6 bg-secondary/30 border-l-4 border-l-destructive flex items-center">
          <Lock className="w-10 h-10 text-destructive mr-4 opacity-50" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('users.suspendedAccounts')}</p>
            <p className="text-2xl font-display font-bold text-white">{users?.filter(u => u.status === 'suspended').length || 0}</p>
          </div>
        </Card>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('users.colDesignation')}</Th>
                <Th>{t('users.colRole')}</Th>
                <Th>{t('users.colOrganization')}</Th>
                <Th>{t('users.colStatus')}</Th>
                <Th>{t('users.colLastUplink')}</Th>
                <Th className="text-right">{t('users.colActions')}</Th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/40 transition-colors group">
                  <Td>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-display font-bold mr-4 shadow-inner">
                        {user.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
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
                  <Td className="text-sm font-medium text-foreground">{user.organization}</Td>
                  <Td>
                    <div className="flex items-center text-xs font-bold uppercase tracking-wider">
                      <div className={cn(
                        "w-2 h-2 rounded-full mr-2", 
                        user.status === 'active' ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
                        user.status === 'suspended' ? "bg-destructive" : "bg-muted-foreground"
                      )} />
                      <span className={user.status === 'active' ? 'text-white' : 'text-muted-foreground'}>{user.status}</span>
                    </div>
                  </Td>
                  <Td className="text-sm text-muted-foreground font-mono">
                    {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : t('users.never')}
                  </Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="sm" className="text-xs font-medium hover:bg-destructive/10 hover:text-destructive">{t('users.revokeAccess')}</Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </motion.div>
  );
}
