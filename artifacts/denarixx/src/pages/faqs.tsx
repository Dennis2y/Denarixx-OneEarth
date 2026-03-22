import React from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, Badge } from '@/components/ui-core';
import { HelpCircle, Shield, Zap, Globe, Bell, Cpu, MapPin, Users } from 'lucide-react';

const FAQS = [
  {
    q: 'What is Denarixx OneEarth?',
    a: 'Denarixx OneEarth is a futuristic AI-powered command and resilience platform concept designed to unify infrastructure monitoring, threat awareness, emergency coordination, and decision support in one premium interface.',
  },
  {
    q: 'What problem is the platform trying to solve?',
    a: 'The idea is to reduce fragmentation between critical systems by bringing alerts, monitoring, response coordination, personnel oversight, and infrastructure intelligence into one command environment.',
  },
  {
    q: 'Is this a real system or a concept?',
    a: 'At this stage, it is a working product concept and presentation prototype. It demonstrates how a modern command platform could look and behave across desktop and mobile while showcasing the Denarixx OneEarth vision.',
  },
  {
    q: 'What does the Energy Grid module do?',
    a: 'The Energy Grid module represents monitoring of energy availability, stability, and resilience signals across connected sites or regions.',
    icon: 'energy',
  },
  {
    q: 'What does LifeMesh represent?',
    a: 'LifeMesh represents a human protection and response network focused on protected persons, incident visibility, and safety-oriented coordination.',
    icon: 'lifemesh',
  },
  {
    q: 'What is EarthShield intelligence?',
    a: 'EarthShield represents environmental and threat intelligence, helping surface risk zones, emergency indicators, and high-priority incidents that need attention.',
    icon: 'earthshield',
  },
  {
    q: 'What is shown on the dashboard?',
    a: 'The dashboard gives a high-level operational view: threat condition, active alerts, protected entities, nodes, energy availability, urgent queues, live feeds, top-risk sites, and command history.',
  },
  {
    q: 'What is the Command Center used for?',
    a: 'The Command Center is designed as the orchestration layer where operators can simulate, assess, escalate, and coordinate responses based on live system signals and threat conditions.',
  },
  {
    q: 'What is the Global Map for?',
    a: 'The Global Map is used to visualize monitored sites, hotspots, alerts, and operational patterns geographically so users can quickly understand where action is needed.',
  },
  {
    q: 'Who is this platform for?',
    a: 'The concept is aimed at emergency coordinators, infrastructure operators, government responders, resilience planners, NGOs, and organizations that need a unified operational awareness system.',
  },
  {
    q: 'Why are personnel and clearance levels included?',
    a: 'Personnel and clearance views reflect the idea that sensitive response systems require role-based access, operator identity, and controlled permissions.',
  },
  {
    q: 'Why does the interface look premium and futuristic?',
    a: 'The visual style is intentional. Denarixx OneEarth is positioned as a high-end next-generation command platform, so the interface emphasizes clarity, confidence, intelligence, and strong presentation value.',
  },
];

function ModuleChip({ type }: { type?: string }) {
  if (type === 'energy') {
    return <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"><Zap className="mr-1 h-3.5 w-3.5" /> Energy Grid</Badge>;
  }
  if (type === 'lifemesh') {
    return <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-300"><Shield className="mr-1 h-3.5 w-3.5" /> LifeMesh</Badge>;
  }
  if (type === 'earthshield') {
    return <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-300"><Globe className="mr-1 h-3.5 w-3.5" /> EarthShield</Badge>;
  }
  return null;
}

export default function FAQsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader
        title="FAQs"
        description="A quick guide to what Denarixx OneEarth is, how the platform works, and what each major part of the system represents."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold text-white">Unified Command</div>
              <div className="text-xs text-muted-foreground">One platform view</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-red-300" />
            <div>
              <div className="text-sm font-semibold text-white">Threat Awareness</div>
              <div className="text-xs text-muted-foreground">Live alerts and risk signals</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-sky-300" />
            <div>
              <div className="text-sm font-semibold text-white">Geographic Visibility</div>
              <div className="text-xs text-muted-foreground">Global map and site tracking</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border/60 bg-card/70">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-amber-300" />
            <div>
              <div className="text-sm font-semibold text-white">Controlled Access</div>
              <div className="text-xs text-muted-foreground">Roles and personnel clearance</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">How the system works</div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {FAQS.map((item, idx) => (
            <div key={item.q} className="rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-white">{idx + 1}. {item.q}</div>
                <ModuleChip type={item.icon as string | undefined} />
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-300">{item.a}</div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
