import React from 'react';
import { Card, Button } from '@/components/ui-core';
import { Link } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="w-full max-w-md p-10 text-center relative z-10 border-destructive/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-widest">ERROR 404</h1>
          <p className="text-muted-foreground mb-8">The requested module or interface directory does not exist in the Denarixx network.</p>
          
          <Link href="/dashboard" className="inline-block w-full">
            <Button className="w-full h-12 text-lg">Return to Command Center</Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
}
