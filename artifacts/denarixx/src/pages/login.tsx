import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Card, Button, Input, Label } from '@/components/ui-core';

export default function Login() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLocation("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden selection:bg-primary/30">
       {/* Luxury Ambient Glows */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
       <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
       
       <Card className="w-full max-w-md p-10 relative z-10 border-primary/20 shadow-[0_0_60px_rgba(201,168,76,0.15)] bg-background/60">
         <div className="flex flex-col items-center mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} alt="Denarixx" className="h-20 w-20 mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(201,168,76,0.6)]" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-[0.2em] text-white text-center">DENARIXX</h1>
            <p className="text-xs text-primary tracking-[0.3em] mt-3 uppercase font-semibold">OneEarth Command</p>
         </div>
         
         <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
               <Label className="text-muted-foreground uppercase tracking-widest text-xs">Operator Identity</Label>
               <Input placeholder="Enter Access Code" required className="h-12 bg-black/50 border-primary/30 focus:border-primary" />
            </div>
            <div className="space-y-3">
               <Label className="text-muted-foreground uppercase tracking-widest text-xs">Security Passphrase</Label>
               <Input type="password" placeholder="••••••••" required className="h-12 bg-black/50 border-primary/30 focus:border-primary" />
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full h-14 text-sm font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(201,168,76,0.3)]" disabled={loading}>
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Initiate Uplink"}
              </Button>
            </div>
         </form>
         
         <div className="mt-8 text-center border-t border-border/50 pt-6">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Global Unified AI Infrastructure Intelligence</p>
            <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest mt-1">Classified Level 5 Access Only</p>
         </div>
       </Card>
    </div>
  )
}
