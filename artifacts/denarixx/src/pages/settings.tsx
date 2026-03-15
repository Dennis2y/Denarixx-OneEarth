import React from 'react';
import { PageHeader, Card, Button, Label, Input } from '@/components/ui-core';
import { Shield, Key, Database, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title="System Parameters" 
        description="Configure global platform thresholds, integrations, and security policies."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <Button variant="secondary" className="w-full justify-start text-primary bg-secondary/80 border border-primary/20">
            <Monitor className="w-5 h-5 mr-3" /> Core Preferences
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Shield className="w-5 h-5 mr-3" /> Security & Auth
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Database className="w-5 h-5 mr-3" /> API Integrations
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Key className="w-5 h-5 mr-3" /> Encryption Keys
          </Button>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8">
            <h3 className="text-xl font-display font-semibold text-white mb-6 border-b border-border/50 pb-4">Global Interface Theme</h3>
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
              <div>
                <h4 className="font-bold text-white">Enforce Luxury Dark Protocol</h4>
                <p className="text-sm text-muted-foreground mt-1">Locks all operators into the high-contrast dark theme for optimal low-light visibility.</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-primary relative cursor-not-allowed opacity-80">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-black" />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-display font-semibold text-white mb-6 border-b border-border/50 pb-4">Emergency Thresholds</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Battery Critical Alert Threshold (%)</Label>
                <Input type="number" defaultValue={20} className="w-32" />
                <p className="text-xs text-muted-foreground">Automatically dispatch warnings when site batteries fall below this value.</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-border/50">
                <Label>EarthShield Auto-Trigger Distance (km)</Label>
                <Input type="number" defaultValue={50} className="w-32" />
                <p className="text-xs text-muted-foreground">Automatically link disaster events to sites within this radius.</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex justify-end">
              <Button>Commit Parameter Changes</Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
