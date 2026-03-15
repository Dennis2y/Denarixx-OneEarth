import React from 'react';
import { useGetUsers } from '@workspace/api-client-react';
import { PageHeader, LoadingScreen, Card, Badge, Table, Th, Td, Button } from '@/components/ui-core';
import { Users as UsersIcon, Shield, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Users() {
  const { data: users, isLoading } = useGetUsers();

  if (isLoading) return <LoadingScreen />;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="Personnel Registry" 
        description="Manage authenticated operators and organizational access levels."
        actions={<Button variant="outline"><UsersIcon className="w-4 h-4 mr-2" /> Invite Operator</Button>}
      />

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Operator Name</Th>
              <Th>Clearance Role</Th>
              <Th>Organization</Th>
              <Th>System Status</Th>
              <Th>Last Uplink</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                <Td>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold mr-4">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{user.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1" /> {user.email}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge variant={user.role === 'admin' ? 'critical' : 'default'} className="bg-transparent border-primary/50">
                    <Shield className="w-3 h-3 mr-1" /> {user.role}
                  </Badge>
                </Td>
                <Td className="text-sm font-medium">{user.organization}</Td>
                <Td>
                  <Badge variant={user.status === 'active' ? 'safe' : 'warning'}>{user.status}</Badge>
                </Td>
                <Td className="text-sm text-muted-foreground">
                  {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, HH:mm') : 'Never'}
                </Td>
                <Td>
                  <Button variant="ghost" size="sm" className="text-xs">Revoke Access</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </motion.div>
  );
}
