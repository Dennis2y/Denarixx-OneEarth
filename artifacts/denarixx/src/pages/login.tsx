import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Shield, Zap, Globe, AlertCircle } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui-core';
import { useAuth } from '@/context/auth';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('commander@denarixx.io');
  const [password, setPassword] = useState('denarixx2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (isAuthenticated) setLocation('/dashboard');
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      setLocation('/dashboard');
    } else {
      setError(result.error ?? 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden selection:bg-primary/30">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}africa-night-hero.png)`,
          opacity: videoLoaded ? 0 : 1,
        }}
      />

      {/* Background video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms]"
        style={{ opacity: videoLoaded ? 1 : 0 }}
        autoPlay loop muted playsInline
        onLoadedData={() => setVideoLoaded(true)}
        src={`${import.meta.env.BASE_URL}africa-city-night.mp4`}
      />

      {/* Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />

      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] z-10 pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] z-10 pointer-events-none animate-pulse" style={{ animationDuration: '11s' }} />

      {/* Module badges */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-6 z-20 px-4">
        {[
          { icon: Zap, label: 'Energy Grid', color: 'text-primary' },
          { icon: Shield, label: 'LifeMesh', color: 'text-green-400' },
          { icon: Globe, label: 'EarthShield', color: 'text-blue-400' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur border border-white/10 text-xs text-white/70 font-medium">
            <Icon className={`w-3 h-3 ${color}`} />
            <span className="hidden sm:inline">{label}</span>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${color.replace('text-', 'bg-')}`} />
          </div>
        ))}
      </div>

      {/* Login card */}
      <div className="relative z-20 w-full max-w-md px-4">
        <div className="backdrop-blur-xl bg-black/55 border border-white/10 rounded-3xl p-10 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(201,168,76,0.1)]">
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
              <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} alt="Denarixx" className="h-20 w-20 relative z-10 drop-shadow-[0_0_20px_rgba(201,168,76,0.7)]" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-[0.22em] text-white text-center drop-shadow-lg">DENARIXX</h1>
            <p className="text-[11px] text-primary tracking-[0.4em] mt-2 uppercase font-bold">OneEarth Command</p>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mt-4" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Operator Identity</Label>
              <Input
                type="email"
                placeholder="Enter Access Email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 bg-black/60 border-white/15 focus:border-primary/70 text-white placeholder:text-white/30 rounded-xl"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Security Passphrase</Label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 bg-black/60 border-white/15 focus:border-primary/70 text-white placeholder:text-white/30 rounded-xl"
                autoComplete="current-password"
              />
            </div>

            {/* Demo accounts hint */}
            <div className="text-[10px] text-white/30 bg-white/5 rounded-lg p-3 border border-white/5">
              <span className="text-white/50 font-semibold">Demo accounts: </span>
              commander@denarixx.io / denarixx2026 · adaeze@denarixx.io / operator123
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-14 text-sm font-bold uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(201,168,76,0.4)] rounded-xl" disabled={loading}>
                {loading ? <span className="flex items-center gap-3"><Loader2 className="animate-spin w-5 h-5" /> Authenticating...</span> : 'Initiate Uplink'}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Global Unified AI Infrastructure · Classified Level 5</p>
            <p className="text-[9px] text-primary/40 uppercase tracking-[0.15em] mt-1">v2.4.1 — OneEarth Platform</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
        <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-mono">
          Denarixx OneEarth · Africa AI Infrastructure Command © 2026
        </p>
      </div>
    </div>
  );
}
