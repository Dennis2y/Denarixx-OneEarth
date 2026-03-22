import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, Badge, cn } from '@/components/ui-core';
import {
  HelpCircle,
  Shield,
  Zap,
  Globe,
  Bell,
  Cpu,
  MapPin,
  Users,
  ChevronDown,
  Search,
} from 'lucide-react';

type FAQItem = {
  q: string;
  a: string;
  icon?: 'energy' | 'lifemesh' | 'earthshield' | 'command' | 'alerts' | 'map' | 'users' | 'general';
  group: 'Overview' | 'Modules' | 'Operations' | 'Access';
};

const FAQS: FAQItem[] = [
  {
    group: 'Overview',
    icon: 'general',
    q: 'What is Denarixx OneEarth?',
    a: 'Denarixx OneEarth is a futuristic AI-powered command and resilience platform concept designed to unify infrastructure monitoring, threat awareness, emergency coordination, and decision support in one premium interface.',
  },
  {
    group: 'Overview',
    icon: 'general',
    q: 'What problem is the platform trying to solve?',
    a: 'The platform is designed to reduce fragmentation between critical systems by bringing alerts, monitoring, response coordination, personnel oversight, and infrastructure intelligence into one command environment.',
  },
  {
    group: 'Overview',
    icon: 'general',
    q: 'Is this a real system or a concept?',
    a: 'At this stage, it is a working product concept and presentation prototype. It demonstrates how a modern command platform could look and behave across desktop and mobile while showcasing the Denarixx OneEarth vision.',
  },
  {
    group: 'Modules',
    icon: 'energy',
    q: 'What does the Energy Grid module do?',
    a: 'The Energy Grid module represents monitoring of energy availability, stability, and resilience signals across connected sites or regions.',
  },
  {
    group: 'Modules',
    icon: 'lifemesh',
    q: 'What does LifeMesh represent?',
    a: 'LifeMesh represents a human protection and response network focused on protected persons, incident visibility, and safety-oriented coordination.',
  },
  {
    group: 'Modules',
    icon: 'earthshield',
    q: 'What is EarthShield intelligence?',
    a: 'EarthShield represents environmental and threat intelligence, helping surface risk zones, emergency indicators, and high-priority incidents that need attention.',
  },
  {
    group: 'Operations',
    icon: 'general',
    q: 'What is shown on the dashboard?',
    a: 'The dashboard gives a high-level operational view: threat condition, active alerts, protected entities, nodes, energy availability, urgent queues, live feeds, top-risk sites, and command history.',
  },
  {
    group: 'Operations',
    icon: 'command',
    q: 'What is the Command Center used for?',
    a: 'The Command Center is designed as the orchestration layer where operators can simulate, assess, escalate, and coordinate responses based on live system signals and threat conditions.',
  },
  {
    group: 'Operations',
    icon: 'map',
    q: 'What is the Global Map for?',
    a: 'The Global Map is used to visualize monitored sites, hotspots, alerts, and operational patterns geographically so users can quickly understand where action is needed.',
  },
  {
    group: 'Overview',
    icon: 'general',
    q: 'Who is this platform for?',
    a: 'The concept is aimed at emergency coordinators, infrastructure operators, government responders, resilience planners, NGOs, and organizations that need a unified operational awareness system.',
  },
  {
    group: 'Access',
    icon: 'users',
    q: 'Why are personnel and clearance levels included?',
    a: 'Personnel and clearance views reflect the idea that sensitive response systems require role-based access, operator identity, and controlled permissions.',
  },
  {
    group: 'Overview',
    icon: 'general',
    q: 'Why does the interface look premium and futuristic?',
    a: 'The visual style is intentional. Denarixx OneEarth is positioned as a high-end next-generation command platform, so the interface emphasizes clarity, confidence, intelligence, and strong presentation value.',
  },
];

function iconFor(type?: FAQItem['icon']) {
  if (type === 'energy') return <Zap className="h-4 w-4 text-emerald-300" />;
  if (type === 'lifemesh') return <Shield className="h-4 w-4 text-amber-300" />;
  if (type === 'earthshield') return <Globe className="h-4 w-4 text-sky-300" />;
  if (type === 'command') return <Cpu className="h-4 w-4 text-cyan-300" />;
  if (type === 'alerts') return <Bell className="h-4 w-4 text-red-300" />;
  if (type === 'map') return <MapPin className="h-4 w-4 text-violet-300" />;
  if (type === 'users') return <Users className="h-4 w-4 text-primary" />;
  return <HelpCircle className="h-4 w-4 text-primary" />;
}

function chipFor(type?: FAQItem['icon']) {
  if (type === 'energy') return <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">Energy Grid</Badge>;
  if (type === 'lifemesh') return <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-300">LifeMesh</Badge>;
  if (type === 'earthshield') return <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-300">EarthShield</Badge>;
  if (type === 'command') return <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-300">Command Center</Badge>;
  if (type === 'alerts') return <Badge className="border-red-500/20 bg-red-500/10 text-red-300">Alerts</Badge>;
  if (type === 'map') return <Badge className="border-violet-500/20 bg-violet-500/10 text-violet-300">Global Map</Badge>;
  if (type === 'users') return <Badge className="border-primary/20 bg-primary/10 text-primary">Access & Users</Badge>;
  return <Badge className="border-border/60 bg-background/40 text-muted-foreground">Overview</Badge>;
}

function FAQRow({
  item,
  open,
  onToggle,
}: {
  item: FAQItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
      >
        <div className="mt-0.5 shrink-0 rounded-xl border border-border/60 bg-card/70 p-2">
          {iconFor(item.icon)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="pr-2 text-base font-semibold text-white sm:text-lg">
              {item.q}
            </div>
            <div className="shrink-0">
              {chipFor(item.icon)}
            </div>
          </div>
        </div>

        <ChevronDown
          className={cn(
            'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180 text-white'
          )}
        />
      </button>

      {open ? (
        <div className="border-t border-border/50 px-4 pb-4 pt-4 sm:px-5">
          <div className="text-sm leading-7 text-slate-300 sm:text-[15px]">
            {item.a}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FAQsPage() {
  const [query, setQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'What is Denarixx OneEarth?': true,
    'What problem is the platform trying to solve?': true,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [query]);

  const groups: Array<FAQItem['group']> = ['Overview', 'Modules', 'Operations', 'Access'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-7xl space-y-5 px-4 py-4 sm:px-6 sm:py-6"
    >
      <PageHeader
        title="FAQs"
        description="A clearer guide to what Denarixx OneEarth is, how it works, and what each major part of the system represents."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold text-white">Unified Command</div>
              <div className="text-xs text-muted-foreground">One platform view</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-red-300" />
            <div>
              <div className="text-sm font-semibold text-white">Threat Awareness</div>
              <div className="text-xs text-muted-foreground">Live alerts and risk signals</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-sky-300" />
            <div>
              <div className="text-sm font-semibold text-white">Geographic Visibility</div>
              <div className="text-xs text-muted-foreground">Global map and site tracking</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-amber-300" />
            <div>
              <div className="text-sm font-semibold text-white">Controlled Access</div>
              <div className="text-xs text-muted-foreground">Roles and personnel clearance</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold text-white">How the system works</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Browse by section or search for a specific question.
            </div>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground outline-none"
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="hidden h-fit border border-border/60 bg-card/70 p-4 xl:block">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Sections
          </div>
          <div className="mt-4 space-y-2">
            {groups.map((group) => {
              const count = filtered.filter((item) => item.group === group).length;
              if (!count) return null;
              return (
                <div
                  key={group}
                  className="rounded-xl border border-border/60 bg-background/40 px-3 py-3"
                >
                  <div className="text-sm font-semibold text-white">{group}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{count} question{count > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          {groups.map((group) => {
            const items = filtered.filter((item) => item.group === group);
            if (!items.length) return null;

            return (
              <Card key={group} className="border border-border/60 bg-card/70">
                <div className="border-b border-border/50 px-4 py-4 sm:px-5">
                  <div className="text-sm font-semibold text-white">{group}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {items.length} question{items.length > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-3 p-3 sm:p-4">
                  {items.map((item) => (
                    <FAQRow
                      key={item.q}
                      item={item}
                      open={!!openItems[item.q]}
                      onToggle={() =>
                        setOpenItems((current) => ({
                          ...current,
                          [item.q]: !current[item.q],
                        }))
                      }
                    />
                  ))}
                </div>
              </Card>
            );
          })}

          {!filtered.length ? (
            <Card className="border border-border/60 bg-card/70 p-6 text-center">
              <div className="text-base font-semibold text-white">No matching FAQ found</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Try a different search word like dashboard, command, access, or map.
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
