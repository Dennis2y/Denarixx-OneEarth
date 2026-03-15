import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Shield, Globe, ChevronRight, ArrowRight, CheckCircle, MapPin, Users,
  AlertTriangle, Activity, BarChart3, Cpu, Lock, Radio, FileText, Building2,
  Heart, School, Layers, Play, Star, ExternalLink, Menu, X
} from 'lucide-react';

const GOLD = 'hsl(43, 65%, 52%)';

function CountUp({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function NavBar({ onLogin }: { onLogin: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} alt="Denarixx" className="h-8 w-8 drop-shadow-[0_0_10px_rgba(201,168,76,0.6)]" />
          <div>
            <span className="font-display font-bold tracking-[0.2em] text-white text-lg">DENARIXX</span>
            <span className="hidden sm:inline text-[10px] text-primary tracking-[0.3em] ml-3 uppercase font-bold">OneEarth</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#modules" className="hover:text-primary transition-colors">Modules</a>
          <a href="#metrics" className="hover:text-primary transition-colors">Impact</a>
          <a href="#audience" className="hover:text-primary transition-colors">Who It's For</a>
          <a href="#command-center" className="hover:text-primary transition-colors">Command Center</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-black font-bold text-sm tracking-wide hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_30px_rgba(201,168,76,0.5)]"
          >
            <Play className="w-3.5 h-3.5 fill-black" /> Demo Login
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-white/70 hover:text-white">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-6 py-4 space-y-4">
          {['modules', 'metrics', 'audience', 'command-center'].map(id => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="block text-white/70 hover:text-primary py-1 capitalize transition-colors">
              {id.replace('-', ' ')}
            </a>
          ))}
          <button onClick={onLogin} className="w-full mt-2 px-5 py-3 rounded-xl bg-primary text-black font-bold text-sm">
            Demo Login
          </button>
        </div>
      )}
    </header>
  );
}

function ModuleCard({ icon: Icon, title, subtitle, color, items }: {
  icon: React.FC<{ className?: string }>; title: string; subtitle: string; color: string; items: string[];
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group flex flex-col h-full rounded-3xl border bg-black/40 backdrop-blur-md overflow-hidden p-8"
      style={{ borderColor: `${color}40` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}15, transparent 60%)` }} />
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-white/50 mb-6 leading-relaxed">{subtitle}</p>
      <ul className="space-y-2.5 mt-auto">
        {items.map(item => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function AudienceCard({ icon: Icon, title, desc, color }: { icon: React.FC<{ className?: string }>; title: string; desc: string; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-primary/40 transition-all"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const goLogin = () => setLocation('/login');
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-[hsl(220,18%,6%)] text-white selection:bg-primary/30 overflow-x-hidden">
      <NavBar onLogin={goLogin} />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}africa-night-hero.png)` }}
        />
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          autoPlay loop muted playsInline
          src={`${import.meta.env.BASE_URL}africa-city-night.mp4`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(220,18%,6%)]/60 to-[hsl(220,18%,6%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,18%,6%)]/60 via-transparent to-[hsl(220,18%,6%)]/60" />

        {/* Gold ambient glows */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[160px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

        {/* Scan line texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Module badges */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-3 mb-12 flex-wrap"
          >
            {[
              { icon: Zap, label: 'Denarixx Energy', color: GOLD },
              { icon: Shield, label: 'Denarixx LifeMesh', color: '#4ade80' },
              { icon: Globe, label: 'Denarixx EarthShield', color: '#60a5fa' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur text-xs font-bold tracking-wider" style={{ color }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-display font-black tracking-tight leading-none mb-6">
              <span className="block text-white">Resilience</span>
              <span className="block" style={{ color: GOLD }}>Infrastructure</span>
              <span className="block text-white">for Africa.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            AI-powered resilience infrastructure platform connecting energy, human safety, and disaster intelligence across the continent.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={goLogin}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-black font-bold text-base tracking-wide transition-all"
              style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43,75%,62%))`, boxShadow: '0 0 40px rgba(201,168,76,0.4)' }}
            >
              <Play className="w-4 h-4 fill-black" />
              Access Demo Platform
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#modules"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border border-white/20 text-white/80 hover:border-primary/50 hover:text-white backdrop-blur bg-white/5 transition-all hover:bg-white/10"
            >
              Explore Platform <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 text-[11px] text-white/30 uppercase tracking-[0.3em] font-mono"
          >
            Demonstration environment · Classified Level 5 · V2.4.1
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 1.2, y: { repeat: Infinity, duration: 1.8 } }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-mono">Scroll</p>
        </motion.div>
      </section>

      {/* ── METRICS ── */}
      <section id="metrics" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,18%,6%)] via-black/50 to-[hsl(220,18%,6%)]" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-4">Live Platform Impact</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">Operational at Scale</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: MapPin, label: 'Sites Monitored', end: 248, suffix: '', color: GOLD },
              { icon: Users, label: 'Protected People', end: 184700, suffix: '+', color: '#4ade80' },
              { icon: Globe, label: 'Regions Covered', end: 31, suffix: '', color: '#60a5fa' },
              { icon: AlertTriangle, label: 'Active Alerts', end: 17, suffix: '', color: '#f97316' },
            ].map(({ icon: Icon, label, end, suffix, color }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.04 }}
                className="relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm text-center overflow-hidden group"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(ellipse at center, ${color}12, transparent 70%)` }} />
                <Icon className="w-8 h-8 mx-auto mb-4" style={{ color }} />
                <div className="text-4xl md:text-5xl font-display font-black mb-2" style={{ color }}>
                  <CountUp end={end} suffix={suffix} />
                </div>
                <p className="text-sm text-white/50 font-medium uppercase tracking-widest">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Resilience score bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 p-8 rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-1">Platform Resilience Score</p>
                <h3 className="text-3xl font-display font-bold text-white">87 / 100 <span className="text-primary text-2xl">↑ Operational</span></h3>
                <p className="text-sm text-white/40 mt-1">Based on real-time energy availability, alert response times, and site uptime across all active nodes.</p>
              </div>
              <div className="w-full md:w-72 shrink-0">
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>Resilience Index</span><span className="text-primary font-bold">87%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '87%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${GOLD}, hsl(43,75%,62%))` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules" className="py-28 relative">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top center, ${GOLD}08, transparent 60%)` }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-4">Integrated Modules</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Three Systems. One Platform.</h2>
            <p className="text-white/50 max-w-xl mx-auto">Every module shares data, alerts, and intelligence — creating a unified resilience infrastructure unlike anything available in the region.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}>
              <ModuleCard
                icon={Zap}
                title="Denarixx Energy"
                subtitle="Real-time solar microgrid monitoring, battery telemetry, and energy resilience scoring for off-grid communities."
                color={GOLD}
                items={[
                  'Live solar generation & battery metrics',
                  'Community load forecasting',
                  'Grid failure detection & alerts',
                  'Multi-site energy coordination',
                  'Historical trend analysis',
                ]}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <ModuleCard
                icon={Shield}
                title="Denarixx LifeMesh"
                subtitle="Person safety tracking, SOS incident management, and protected populations monitoring across all linked nodes."
                color="#4ade80"
                items={[
                  'Protected persons registry',
                  'SOS incident detection & triage',
                  'Safe/at-risk/evacuated status',
                  'Emergency contact management',
                  'Cross-site incident coordination',
                ]}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <ModuleCard
                icon={Globe}
                title="Denarixx EarthShield"
                subtitle="Multi-hazard disaster intelligence, geo risk zones, and early warning systems integrated with live alert feeds."
                color="#60a5fa"
                items={[
                  'Flood, wildfire & storm monitoring',
                  'Risk zone preparedness scoring',
                  'Affected population estimates',
                  'Incident timeline tracking',
                  'AI scenario simulation',
                ]}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COMMAND CENTER PREVIEW ── */}
      <section id="command-center" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,18%,6%)] via-[hsl(220,18%,4%)] to-[hsl(220,18%,6%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-4">OneEarth Command Center</p>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                The Unified<br /><span style={{ color: GOLD }}>System Brain</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                Run multi-hazard scenario simulations, track operator responses, generate institutional reports, and manage cross-module alerts — all from a single command interface.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  { icon: Activity, label: '6 scenario simulation types with AI readiness scoring' },
                  { icon: BarChart3, label: 'Full operator attribution and audit trail' },
                  { icon: FileText, label: 'One-click site, scenario, and alert report export' },
                  { icon: Radio, label: 'Emergency broadcast with zone targeting' },
                  { icon: Cpu, label: 'Real-time escalation timeline and recommended actions' },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    </div>
                    {label}
                  </li>
                ))}
              </ul>
              <button
                onClick={goLogin}
                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl text-black font-bold text-sm transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43,75%,62%))`, boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}
              >
                <Play className="w-4 h-4 fill-black" /> Access Command Center <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Simulated UI preview */}
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="relative rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                {/* Fake title bar */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-[11px] text-white/30 font-mono uppercase tracking-widest">DENARIXX COMMAND CENTER</span>
                </div>
                <div className="p-6 space-y-4">
                  {/* Scenario selector mock */}
                  <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] text-primary uppercase tracking-widest font-bold">Active Scenario</p>
                        <p className="text-white font-bold mt-1">Flood Event — Multi-Site Response</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
                        <span className="text-destructive text-[10px] font-bold uppercase">Critical</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Readiness', val: '54%', color: 'text-destructive' },
                        { label: 'Sites', val: '5', color: 'text-amber-500' },
                        { label: 'Persons', val: '7', color: 'text-blue-400' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="text-center bg-secondary/30 rounded-xl p-3">
                          <p className={`text-xl font-display font-bold ${color}`}>{val}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Recommended Actions</p>
                    {[
                      'Activate emergency power reserves at 5 sites',
                      'Issue LifeMesh evacuation alert for affected zones',
                      'Notify government coordination team',
                    ].map((action, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-black" style={{ backgroundColor: GOLD }}>{i + 1}</div>
                        {action}
                      </div>
                    ))}
                  </div>

                  {/* Audit line */}
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/5">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">CP</div>
                    <div>
                      <p className="text-xs font-bold text-white">Cmdr. Prime</p>
                      <p className="text-[10px] text-white/40 font-mono">scenario.run · flood_event · just now</p>
                    </div>
                    <span className="ml-auto text-[10px] text-primary font-bold uppercase tracking-widest border border-primary/30 bg-primary/10 px-2 py-0.5 rounded">ADMIN</span>
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-8 bg-primary/5 rounded-[40px] blur-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section id="audience" className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-4">Designed For</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Built for Institutions That Matter</h2>
            <p className="text-white/50 max-w-xl mx-auto">From national government coordination centers to community health clinics — Denarixx OneEarth serves every layer of resilience infrastructure.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Building2, title: 'Governments', desc: 'National and regional disaster management agencies gaining AI-assisted situation awareness and cross-ministry coordination tools.', color: '#60a5fa' },
              { icon: Heart, title: 'NGOs & Humanitarian', desc: 'Relief organizations managing field teams, tracking affected populations, and coordinating infrastructure responses across multiple sites.', color: '#f87171' },
              { icon: Users, title: 'Community Leaders', desc: 'Local community organizations monitoring their facilities, understanding risks, and receiving early warnings in their language.', color: '#4ade80' },
              { icon: Activity, title: 'Infrastructure Operators', desc: 'Grid operators, solar technicians, and facility managers with real-time control of energy systems and alert response workflows.', color: GOLD },
              { icon: School, title: 'Critical Facilities', desc: 'Schools, clinics, and emergency shelters requiring continuous monitoring, priority alerts, and backup energy coordination.', color: '#a78bfa' },
              { icon: Layers, title: 'Investors & Partners', desc: 'Development finance institutions and climate investors seeking verifiable impact metrics, operational transparency, and scale-readiness.', color: '#34d399' },
            ].map(card => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <AudienceCard {...card} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="py-16 border-y border-white/10 bg-white/3 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">End-to-End Secured</p>
                <p className="text-white/40 text-xs">Role-based access, audit logs, encrypted sessions</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">18 Languages</p>
                <p className="text-white/40 text-xs">Africa, Europe, Asia, Middle East — fully localized</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">Institutional Grade</p>
                <p className="text-white/40 text-xs">Built for governments, NGOs, and critical facilities</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">Always-On Monitoring</p>
                <p className="text-white/40 text-xs">24/7 real-time telemetry and alert systems</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${GOLD}10, transparent 70%)` }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-4">Ready to Explore?</p>
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-6 leading-tight">
              Enter the<br /><span style={{ color: GOLD }}>Command Center</span>
            </h2>
            <p className="text-white/50 mb-10 text-lg leading-relaxed">
              The demo environment is fully seeded with realistic African infrastructure data. Log in as any role and explore the complete platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={goLogin}
                className="group flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-black font-black text-lg tracking-wide transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43,75%,62%))`, boxShadow: '0 0 50px rgba(201,168,76,0.4)' }}
              >
                <Play className="w-5 h-5 fill-black" />
                Access Demo
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="mailto:contact@denarixx.io"
                className="flex items-center justify-center gap-2 px-10 py-5 rounded-2xl font-bold text-lg border border-white/20 text-white/70 hover:border-primary/50 hover:text-white transition-all"
              >
                <ExternalLink className="w-5 h-5" /> Request Access
              </a>
            </div>

            <p className="text-[11px] text-white/25 uppercase tracking-[0.3em] font-mono">
              Demonstration environment · No data is stored · Safe to explore
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-12 bg-black/40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} alt="Denarixx" className="h-10 w-10 drop-shadow-[0_0_12px_rgba(201,168,76,0.5)]" />
              <div>
                <div className="font-display font-bold tracking-[0.2em] text-white text-xl">DENARIXX</div>
                <div className="text-[10px] text-primary tracking-[0.35em] uppercase font-bold">OneEarth Platform</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-white/40">Africa AI Infrastructure Command</p>
              <p className="text-xs text-white/20 mt-1">Unified Energy · LifeMesh · EarthShield Intelligence</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/30 font-mono uppercase tracking-widest">V2.4.1 · 2026</p>
              <p className="text-[10px] text-primary/40 mt-1 font-mono uppercase tracking-widest">Classified · Level 5</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
