import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Loader2, AlertCircle, Zap, Shield, Globe, ChevronRight, ArrowLeft, Check, Lock, Users, BarChart3 } from 'lucide-react';
import { Button, Input, Label, cn } from '@/components/ui-core';
import { useAuth } from '@/context/auth';
import { useTranslation } from 'react-i18next';

interface DemoAccount {
  email: string;
  password: string;
  role: 'admin' | 'operator' | 'government' | 'community';
  name: string;
  org: string;
  clearance: number;
  capabilities: string[];
  color: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'commander@denarixx.io',
    password: 'denarixx2026',
    role: 'admin',
    name: 'Cmdr. Prime',
    org: 'Denarixx HQ',
    clearance: 5,
    capabilities: ['Full platform access', 'User management', 'All reports & exports', 'Emergency controls', 'Scenario simulation'],
    color: 'hsl(43, 65%, 52%)',
    icon: ({ className }) => <Lock className={className} />,
  },
  {
    email: 'adaeze@denarixx.io',
    password: 'operator123',
    role: 'operator',
    name: 'Adaeze Okafor',
    org: 'Lagos Field Ops',
    clearance: 3,
    capabilities: ['Command Center & simulations', 'Alert management & broadcast', 'Sites & energy monitoring', 'Audit log access'],
    color: '#4ade80',
    icon: ({ className }) => <Zap className={className} />,
  },
  {
    email: 'kofi@gov.gh',
    password: 'gov2026',
    role: 'government',
    name: 'Kofi Mensah',
    org: 'Ghana NADMO',
    clearance: 2,
    capabilities: ['Read-only dashboards', 'Report generation', 'Alert monitoring', 'EarthShield intelligence'],
    color: '#60a5fa',
    icon: ({ className }) => <BarChart3 className={className} />,
  },
  {
    email: 'fatuma@community.ke',
    password: 'community1',
    role: 'community',
    name: 'Fatuma Wanjiru',
    org: 'Kibera Community',
    clearance: 1,
    capabilities: ['Local site view', 'Basic alert notifications', 'Energy status overview'],
    color: '#a78bfa',
    icon: ({ className }) => <Users className={className} />,
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Platform Administrator',
  operator: 'Field Operator',
  government: 'Government Viewer',
  community: 'Community Member',
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoAccount | null>(null);
  const [view, setView] = useState<'cards' | 'form'>('cards');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (isAuthenticated) setLocation('/dashboard');
  }, [isAuthenticated, setLocation]);

  const selectDemo = (account: DemoAccount) => {
    setSelectedDemo(account);
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    setView('form');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error ?? 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden selection:bg-primary/30">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}africa-night-hero.png)`, opacity: videoLoaded ? 0 : 1 }}
      />
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms] brightness-[0.9] sm:brightness-100"
        style={{ opacity: videoLoaded ? 1 : 0 }}
        autoPlay loop muted playsInline
        onLoadedData={() => setVideoLoaded(true)}
        src={`${import.meta.env.BASE_URL}africa-city-night.mp4`}
      />
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-black/38 sm:bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-black/28 sm:from-black/95 sm:via-black/20 sm:to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/22 sm:from-black/65 sm:to-black/35" />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] z-10 pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] z-10 pointer-events-none animate-pulse" style={{ animationDuration: '11s' }} />

      {/* Back to landing */}
      <button
        onClick={() => setLocation('/')}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Module badges */}
      <div className="absolute top-6 left-0 right-0 flex justify-center gap-4 z-20 px-4">
        {[
          { icon: Zap, label: 'Energy Grid', color: 'text-primary', dot: 'bg-primary' },
          { icon: Shield, label: 'LifeMesh', color: 'text-green-400', dot: 'bg-green-400' },
          { icon: Globe, label: 'EarthShield', color: 'text-blue-400', dot: 'bg-blue-400' },
        ].map(({ icon: Icon, label, color, dot }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur border border-white/10 text-xs text-white/70 font-medium">
            <Icon className={`w-3 h-3 ${color}`} />
            <span className="hidden sm:inline">{label}</span>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dot}`} />
          </div>
        ))}
      </div>

      <div className="relative z-20 w-full max-w-md px-4">
        <div className="backdrop-blur-xl bg-black/55 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(201,168,76,0.1)] overflow-hidden">

          {/* Header */}
          <div className="flex flex-col items-center pt-10 pb-6 px-10">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
              <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} alt="Denarixx" className="h-16 w-16 relative z-10 drop-shadow-[0_0_20px_rgba(201,168,76,0.7)]" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-[0.2em] text-white">DENARIXX</h1>
            <p className="text-[10px] text-primary tracking-[0.4em] mt-1.5 uppercase font-bold">OneEarth Command</p>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mt-4" />
            <p className="text-[10px] text-white/30 mt-3 uppercase tracking-widest font-mono">Demonstration Environment</p>
          </div>

          {view === 'cards' ? (
            <div className="px-6 pb-8">
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold text-center mb-4">Select a demo role to continue</p>
              <div className="space-y-2.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => selectDemo(account)}
                    className="w-full text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${account.color}15`, borderColor: `${account.color}40` }}>
                        <account.icon className="w-4 h-4" style={{ color: account.color } as React.CSSProperties} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{account.name}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0"
                            style={{ color: account.color, borderColor: `${account.color}40`, backgroundColor: `${account.color}12` }}>
                            {account.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 truncate">{ROLE_LABELS[account.role]} · {account.org}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 pl-12">
                      {account.capabilities.slice(0, 2).map(cap => (
                        <span key={cap} className="text-[9px] text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{cap}</span>
                      ))}
                      {account.capabilities.length > 2 && (
                        <span className="text-[9px] text-white/30">+{account.capabilities.length - 2} more</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <button
                  onClick={() => { setSelectedDemo(null); setEmail(''); setPassword(''); setView('form'); }}
                  className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-2 font-mono uppercase tracking-widest"
                >
                  Use custom credentials
                </button>
              </div>
            </div>
          ) : (
            <div className="px-10 pb-10">
              {selectedDemo && (
                <div className="mb-5 p-4 rounded-2xl border" style={{ borderColor: `${selectedDemo.color}30`, backgroundColor: `${selectedDemo.color}08` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-white">{selectedDemo.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border"
                          style={{ color: selectedDemo.color, borderColor: `${selectedDemo.color}40`, backgroundColor: `${selectedDemo.color}12` }}>
                          {selectedDemo.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40">{selectedDemo.org} · Clearance L{selectedDemo.clearance}</p>
                    </div>
                    <button onClick={() => setView('cards')} className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-mono">Switch</button>
                  </div>
                  <div className="space-y-1">
                    {selectedDemo.capabilities.map(cap => (
                      <div key={cap} className="flex items-center gap-2 text-[10px] text-white/50">
                        <Check className="w-3 h-3 shrink-0" style={{ color: selectedDemo.color }} />
                        {cap}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">{t('login.operatorIdentity')}</Label>
                  <Input
                    type="email"
                    placeholder={t('login.enterEmail')}
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 bg-black/60 border-white/15 focus:border-primary/70 text-white placeholder:text-white/30 rounded-xl"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">{t('login.securityPassphrase')}</Label>
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
                <div className="flex gap-3 pt-1">
                  {view === 'form' && !selectedDemo && (
                    <Button type="button" variant="ghost" onClick={() => setView('cards')} className="h-12 px-5">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-sm font-bold uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(201,168,76,0.35)] rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4" /> {t('login.authenticating')}
                      </span>
                    ) : t('login.initiateUplink')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="px-10 pb-6 border-t border-white/10 pt-5 text-center">
            <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-mono">{t('login.classified')}</p>
            <p className="text-[9px] text-primary/35 uppercase tracking-[0.15em] mt-1">{t('login.version')}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-0 right-0 flex justify-center z-20">
        <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-mono">
          Denarixx OneEarth · Global Resilience Infrastructure Platform © 2026
        </p>
      </div>
    </div>
  );
}
