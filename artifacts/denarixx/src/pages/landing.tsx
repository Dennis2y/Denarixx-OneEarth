import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Shield, Globe, ChevronRight, ArrowRight, CheckCircle, MapPin, Users,
  AlertTriangle, Activity, BarChart3, Cpu, Radio, FileText, Building2,
  Heart, School, Layers, Play, Menu, X, Languages, ChevronDown, Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GOLD = 'hsl(43, 65%, 52%)';

type LangEntry = { code: string; label: string; nativeName: string; dir: 'ltr' | 'rtl' };

const ALL_LANGUAGES: LangEntry[] = [
  { code: 'en', label: 'EN', nativeName: 'English', dir: 'ltr' },
  { code: 'fr', label: 'FR', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', label: 'DE', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'es', label: 'ES', nativeName: 'Español', dir: 'ltr' },
  { code: 'pt', label: 'PT', nativeName: 'Português', dir: 'ltr' },
  { code: 'it', label: 'IT', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'nl', label: 'NL', nativeName: 'Nederlands', dir: 'ltr' },
  { code: 'pl', label: 'PL', nativeName: 'Polski', dir: 'ltr' },
  { code: 'ru', label: 'RU', nativeName: 'Русский', dir: 'ltr' },
  { code: 'tr', label: 'TR', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'sw', label: 'SW', nativeName: 'Kiswahili', dir: 'ltr' },
  { code: 'ar', label: 'AR', nativeName: 'العربية', dir: 'rtl' },
  { code: 'zh', label: 'ZH', nativeName: '中文', dir: 'ltr' },
  { code: 'ja', label: 'JA', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', label: 'KO', nativeName: '한국어', dir: 'ltr' },
  { code: 'hi', label: 'HI', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'fa', label: 'FA', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'he', label: 'HE', nativeName: 'עברית', dir: 'rtl' },
];

function LandingLanguageSwitcher({ label }: { label?: string }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = ALL_LANGUAGES.find(l => l.code === i18n.resolvedLanguage) ?? ALL_LANGUAGES[0];

  const handleSelect = (lang: LangEntry) => {
    i18n.changeLanguage(lang.code);
    document.documentElement.setAttribute('dir', lang.dir);
    document.documentElement.setAttribute('lang', lang.code);
    setOpen(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur text-xs font-bold text-white/80 hover:text-white hover:border-primary/40 hover:bg-white/10 transition-all"
        title={label ?? 'Select Language'}
      >
        <Languages className="w-3.5 h-3.5" />
        <span className="tracking-widest uppercase">{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-black/95 border border-white/15 rounded-2xl shadow-2xl z-[200] overflow-hidden backdrop-blur-xl">
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">{label ?? 'Select Language'}</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {ALL_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  i18n.resolvedLanguage === lang.code
                    ? 'bg-primary/15 text-primary'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="font-medium" dir={lang.dir}>{lang.nativeName}</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-2 shrink-0">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} alt="Denarixx" className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-[0_0_10px_rgba(201,168,76,0.6)]" />
          <div>
            <span className="font-display font-bold tracking-[0.2em] text-white text-base sm:text-lg">DENARIXX</span>
            <span className="hidden sm:inline text-[10px] text-primary tracking-[0.3em] ml-3 uppercase font-bold">OneEarth</span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/70">
          <a href="#modules" className="hover:text-primary transition-colors">{t('landing.navModules')}</a>
          <a href="#metrics" className="hover:text-primary transition-colors">{t('landing.navImpact')}</a>
          <a href="#audience" className="hover:text-primary transition-colors">{t('landing.navWhoFor')}</a>
          <a href="#command-center" className="hover:text-primary transition-colors">{t('landing.navCommandCenter')}</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LandingLanguageSwitcher label={t('landing.selectLanguage')} />
          <button
            onClick={onLogin}
            className="hidden sm:flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-primary text-black font-bold text-sm tracking-wide hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_30px_rgba(201,168,76,0.5)] whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-black shrink-0" /> {t('landing.navDemoLogin')}
          </button>
          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-black/95 border-t border-white/10 px-4 py-4 space-y-3">
          {[
            { id: 'modules', label: t('landing.navModules') },
            { id: 'metrics', label: t('landing.navImpact') },
            { id: 'audience', label: t('landing.navWhoFor') },
            { id: 'command-center', label: t('landing.navCommandCenter') },
          ].map(({ id, label }) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="block text-white/70 hover:text-primary py-2 transition-colors text-sm border-b border-white/5 last:border-0">
              {label}
            </a>
          ))}
          <button onClick={onLogin} className="w-full mt-2 px-5 py-3 rounded-xl bg-primary text-black font-bold text-sm">
            {t('landing.navDemoLogin')}
          </button>
        </div>
      )}
    </header>
  );
}

function ModuleCard({ icon: Icon, title, subtitle, color, items }: {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>; title: string; subtitle: string; color: string; items: string[];
}) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group flex flex-col h-full rounded-3xl border bg-black/40 backdrop-blur-md overflow-hidden p-6 sm:p-8"
      style={{ borderColor: `${color}40` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}15, transparent 60%)` }} />
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border shrink-0"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color }} />
      </div>
      <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-white/50 mb-5 sm:mb-6 leading-relaxed">{subtitle}</p>
      <ul className="space-y-2 sm:space-y-2.5 mt-auto">
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

function AudienceCard({ icon: Icon, title, desc, color }: { icon: React.FC<{ className?: string; style?: React.CSSProperties }>; title: string; desc: string; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="p-5 sm:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-primary/40 transition-all"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h4 className="font-bold text-white mb-2 text-sm sm:text-base">{title}</h4>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const goLogin = () => setLocation('/login');

  return (
    <div className="min-h-[100dvh] bg-[hsl(220,18%,6%)] text-white selection:bg-primary/30 overflow-x-hidden">
      <NavBar onLogin={goLogin} />

      {/* ── HERO ── */}
      <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-14 sm:pt-16">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}africa-night-hero.png)` }} />
        <video className="absolute inset-0 w-full h-full object-cover opacity-50" autoPlay loop muted playsInline
          src={`${import.meta.env.BASE_URL}africa-city-night.mp4`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(220,18%,6%)]/25 to-[hsl(220,18%,6%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,18%,6%)]/30 via-transparent to-[hsl(220,18%,6%)]/30" />
        <div className="absolute top-1/3 left-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-primary/8 rounded-full blur-[120px] sm:blur-[160px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-blue-600/8 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 flex-wrap">
            {[
              { icon: Zap, label: 'Denarixx Energy', color: GOLD },
              { icon: Shield, label: 'LifeMesh', color: '#4ade80' },
              { icon: Globe, label: 'EarthShield', color: '#60a5fa' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur text-[10px] sm:text-xs font-bold tracking-wider" style={{ color }}>
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {label}
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
            <h1 className="text-[clamp(2.4rem,9vw,6.5rem)] font-display font-black tracking-tight leading-none mb-5 sm:mb-6">
              <span className="block text-white">{t('landing.heroLine1')}</span>
              <span className="block" style={{ color: GOLD }}>{t('landing.heroLine2')}</span>
              <span className="block text-white">{t('landing.heroLine3')}</span>
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="text-sm sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-light px-2">
            {t('landing.heroDesc')}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button onClick={goLogin}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-black font-bold text-sm sm:text-base tracking-wide transition-all"
              style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43,75%,62%))`, boxShadow: '0 0 40px rgba(201,168,76,0.4)' }}>
              <Play className="w-4 h-4 fill-black" />
              {t('landing.heroAccess')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#modules"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base border border-white/20 text-white/80 hover:border-primary/50 hover:text-white backdrop-blur bg-white/5 transition-all hover:bg-white/10">
              {t('landing.heroExplore')} <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            className="mt-6 sm:mt-8 text-[10px] sm:text-[11px] text-white/30 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-mono">
            {t('landing.heroClassified')}
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 1.2, y: { repeat: Infinity, duration: 1.8 } }}
          className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-mono">{t('landing.scrollHint')}</p>
        </motion.div>
      </section>

      {/* ── METRICS ── */}
      <section id="metrics" className="py-16 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,18%,6%)] via-black/50 to-[hsl(220,18%,6%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-3 sm:mb-4">{t('landing.metricsLabel')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white">{t('landing.metricsTitle')}</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { icon: MapPin, label: t('landing.metricSites'), end: 248, suffix: '', color: GOLD },
              { icon: Users, label: t('landing.metricPeople'), end: 184700, suffix: '+', color: '#4ade80' },
              { icon: Globe, label: t('landing.metricRegions'), end: 31, suffix: '', color: '#60a5fa' },
              { icon: AlertTriangle, label: t('landing.metricAlerts'), end: 17, suffix: '', color: '#f97316' },
            ].map(({ icon: Icon, label, end, suffix, color }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.04 }}
                className="relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm text-center overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(ellipse at center, ${color}12, transparent 70%)` }} />
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-4" style={{ color }} />
                <div className="text-3xl sm:text-4xl md:text-5xl font-display font-black mb-1 sm:mb-2" style={{ color }}>
                  <CountUp end={end} suffix={suffix} />
                </div>
                <p className="text-[10px] sm:text-sm text-white/50 font-medium uppercase tracking-widest">{label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-6 sm:mt-10 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-1">{t('landing.resilienceLabel')}</p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">87 / 100 <span className="text-primary text-xl sm:text-2xl">{t('landing.resilienceStatus')}</span></h3>
                <p className="text-xs sm:text-sm text-white/40 mt-1">{t('landing.resilienceDesc')}</p>
              </div>
              <div className="w-full md:w-72 shrink-0">
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>{t('landing.resilienceIndex')}</span><span className="text-primary font-bold">87%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: '87%' }} viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.3 }} className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${GOLD}, hsl(43,75%,62%))` }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules" className="py-16 sm:py-28 relative">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top center, ${GOLD}08, transparent 60%)` }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-3 sm:mb-4">{t('landing.modulesLabel')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3 sm:mb-4">{t('landing.modulesTitle')}</h2>
            <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto">{t('landing.modulesDesc')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Zap, title: "Denarixx Energy", color: GOLD, subtitle: t('landing.energySubtitle'), items: [t('landing.energyItem1'), t('landing.energyItem2'), t('landing.energyItem3'), t('landing.energyItem4'), t('landing.energyItem5')] },
              { icon: Shield, title: "Denarixx LifeMesh", color: "#4ade80", subtitle: t('landing.lifemeshSubtitle'), items: [t('landing.lifemeshItem1'), t('landing.lifemeshItem2'), t('landing.lifemeshItem3'), t('landing.lifemeshItem4'), t('landing.lifemeshItem5')] },
              { icon: Globe, title: "Denarixx EarthShield", color: "#60a5fa", subtitle: t('landing.earthshieldSubtitle'), items: [t('landing.earthshieldItem1'), t('landing.earthshieldItem2'), t('landing.earthshieldItem3'), t('landing.earthshieldItem4'), t('landing.earthshieldItem5')] },
            ].map(({ icon, title, color, subtitle, items }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <ModuleCard icon={icon} title={title} subtitle={subtitle} color={color} items={items} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMAND CENTER PREVIEW ── */}
      <section id="command-center" className="py-16 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,18%,6%)] via-[hsl(220,18%,4%)] to-[hsl(220,18%,6%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)', backgroundSize: '100% 3px' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-3 sm:mb-4">{t('landing.ccLabel')}</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6 leading-tight">
                {t('landing.ccTitle1')}<br /><span style={{ color: GOLD }}>{t('landing.ccTitle2')}</span>
              </h2>
              <p className="text-sm sm:text-base text-white/50 leading-relaxed mb-6 sm:mb-8">{t('landing.ccDesc')}</p>
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                {[
                  { icon: Activity, key: 'ccItem1' },
                  { icon: BarChart3, key: 'ccItem2' },
                  { icon: FileText, key: 'ccItem3' },
                  { icon: Radio, key: 'ccItem4' },
                  { icon: Cpu, key: 'ccItem5' },
                ].map(({ icon: Icon, key }) => (
                  <li key={key} className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    </div>
                    {t(`landing.${key}`)}
                  </li>
                ))}
              </ul>
              <button onClick={goLogin}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl text-black font-bold text-sm transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43,75%,62%))`, boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}>
                <Play className="w-4 h-4 fill-black" /> {t('landing.ccAccess')} <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Simulated UI preview */}
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-[9px] sm:text-[11px] text-white/30 font-mono uppercase tracking-widest">DENARIXX COMMAND CENTER</span>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-primary uppercase tracking-widest font-bold">{t('landing.ccScenarioLabel')}</p>
                        <p className="text-white font-bold mt-0.5 sm:mt-1 text-xs sm:text-sm">{t('landing.ccScenarioTitle')}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-destructive/20 border border-destructive/30 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
                        <span className="text-destructive text-[9px] sm:text-[10px] font-bold uppercase">{t('landing.ccCritical')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { key: 'ccReadiness', val: '54%', color: 'text-destructive' },
                        { key: 'ccSites', val: '5', color: 'text-amber-500' },
                        { key: 'ccAtRisk', val: '2,847', color: 'text-orange-400' },
                      ].map(({ key, val, color }) => (
                        <div key={key} className="text-center p-2 rounded-lg bg-white/5">
                          <div className={`text-base sm:text-xl font-display font-bold ${color}`}>{val}</div>
                          <div className="text-[8px] sm:text-[10px] text-white/40 uppercase tracking-widest">{t(`landing.${key}`)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {(['ccAction1', 'ccAction2', 'ccAction3', 'ccAction4'] as const).map((key, i) => (
                      <div key={key} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border text-xs ${i < 2 ? 'border-green-500/20 bg-green-500/5 text-green-400' : 'border-white/10 bg-white/5 text-white/60'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i < 2 ? 'bg-green-500' : 'bg-white/20'}`} />
                        {t(`landing.${key}`)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 sm:-inset-8 rounded-full blur-[60px] sm:blur-[100px] pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${GOLD}10, transparent 70%)`, zIndex: -1 }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section id="audience" className="py-16 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-3 sm:mb-4">{t('landing.audienceLabel')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3 sm:mb-4">{t('landing.audienceTitle')}</h2>
            <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto">{t('landing.audienceDesc')}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Building2, titleKey: 'gov', descKey: 'govDesc', color: GOLD },
              { icon: Heart, titleKey: 'ngo', descKey: 'ngoDesc', color: '#4ade80' },
              { icon: School, titleKey: 'community', descKey: 'communityDesc', color: '#60a5fa' },
              { icon: Lock, titleKey: 'security', descKey: 'securityDesc', color: '#f97316' },
              { icon: Layers, titleKey: 'regional', descKey: 'regionalDesc', color: '#a78bfa' },
              { icon: Radio, titleKey: 'emergency', descKey: 'emergencyDesc', color: '#f43f5e' },
            ].map(({ icon, titleKey, descKey, color }, i) => (
              <motion.div key={titleKey} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <AudienceCard icon={icon} title={t(`landing.${titleKey}`)} desc={t(`landing.${descKey}`)} color={color} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${GOLD}12, transparent 60%)` }} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold mb-3 sm:mb-4">{t('landing.ctaLabel')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
              {t('landing.ctaTitle1')}<br /><span style={{ color: GOLD }}>{t('landing.ctaTitle2')}</span>
            </h2>
            <p className="text-sm sm:text-lg text-white/50 mb-8 sm:mb-10 leading-relaxed">{t('landing.ctaDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button onClick={goLogin}
                className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-black font-bold text-base tracking-wide transition-all"
                style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43,75%,62%))`, boxShadow: '0 0 50px rgba(201,168,76,0.4)' }}>
                <Play className="w-4 h-4 fill-black" />
                {t('landing.heroAccess')}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}denarixx-logo.png`} alt="Denarixx" className="h-7 w-7" />
            <div>
              <span className="font-display font-bold tracking-[0.2em] text-white text-sm">DENARIXX</span>
              <span className="text-[10px] text-primary tracking-[0.3em] ml-2 uppercase font-bold">OneEarth</span>
            </div>
          </div>
          <p className="text-[11px] text-white/30 font-mono text-center">{t('landing.footerText')}</p>
          <LandingLanguageSwitcher label={t('landing.selectLanguage')} />
        </div>
      </footer>
    </div>
  );
}
