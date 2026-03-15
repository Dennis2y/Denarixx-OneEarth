import React, { useState } from 'react';
import { PageHeader, Card, Button, Label, Input, Badge, cn } from '@/components/ui-core';
import { Shield, Key, Database, Monitor, CheckCircle2, XCircle, Zap, Globe, ShieldAlert, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('organization');

  const tabs = [
    { id: 'organization', labelKey: 'settings.coreParameters', icon: Monitor },
    { id: 'notifications', labelKey: 'settings.alertRouting', icon: ShieldAlert },
    { id: 'security', labelKey: 'settings.securityAuth', icon: Shield },
    { id: 'integrations', labelKey: 'settings.dataIntegrations', icon: Database },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader 
        title={t('settings.title')}
        description={t('settings.description')}
      />

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar border-b border-border/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center px-5 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2",
              activeTab === tab.id 
                ? "bg-primary/5 text-primary border-primary shadow-[inset_0_-20px_20px_-20px_rgba(201,168,76,0.3)]" 
                : "text-muted-foreground border-transparent hover:text-white hover:bg-secondary/50"
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'organization' && (
            <div className="space-y-6">
              <Card className="p-4 sm:p-8 border-border/50">
                <h3 className="text-lg sm:text-xl font-display font-semibold text-white mb-5 border-b border-border/50 pb-4">{t('settings.globalInterfacePolicy')}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 bg-secondary/30 rounded-xl border border-border">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-base sm:text-lg">{t('settings.darkProtocol')}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{t('settings.darkProtocolDesc')}</p>
                  </div>
                  <div className="w-14 h-7 rounded-full bg-primary relative cursor-not-allowed opacity-80 shadow-[0_0_15px_rgba(201,168,76,0.5)] shrink-0">
                    <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-black shadow-sm" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-8 border-border/50">
                <h3 className="text-lg sm:text-xl font-display font-semibold text-white mb-5 border-b border-border/50 pb-4">{t('settings.autonomousThresholds')}</h3>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div>
                      <Label className="text-white text-base">{t('settings.batteryCritical')}</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">{t('settings.batteryCriticalDesc')}</p>
                      <Input type="number" defaultValue={20} className="w-32 bg-background text-xl font-mono text-center h-12" />
                    </div>
                    
                    <div>
                      <Label className="text-white text-base">{t('settings.earthshieldRadius')}</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">{t('settings.earthshieldRadiusDesc')}</p>
                      <Input type="number" defaultValue={50} className="w-32 bg-background text-xl font-mono text-center h-12" />
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-border/50 flex justify-end">
                  <Button className="h-12 px-8 text-md shadow-[0_0_15px_rgba(201,168,76,0.2)]">{t('settings.commitChanges')}</Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { name: 'Global NDMA API', descKey: 'settings.ndmaDesc', status: 'connected', icon: Globe },
                { name: 'WHO Bio-Intel', descKey: 'settings.whoDesc', status: 'connected', icon: ShieldAlert },
                { name: 'Tesla Megapack Sys', descKey: 'settings.teslaDesc', status: 'disconnected', icon: Zap },
                { name: 'Starlink Uplink', descKey: 'settings.starlinkDesc', status: 'connected', icon: Activity },
              ].map((int, i) => (
                <Card key={i} className="p-6 flex flex-col h-full border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-card rounded-xl border border-border shadow-inner">
                      <int.icon className="w-6 h-6 text-primary" />
                    </div>
                    {int.status === 'connected' ? (
                      <Badge variant="safe" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1"/> {t('settings.connected')}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground"><XCircle className="w-3 h-3 mr-1"/> {t('settings.offline')}</Badge>
                    )}
                  </div>
                  <h4 className="font-bold text-lg text-white mb-1">{int.name}</h4>
                  <p className="text-sm text-muted-foreground flex-1">{t(int.descKey)}</p>
                  
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <Button variant={int.status === 'connected' ? 'outline' : 'default'} className="w-full">
                      {int.status === 'connected' ? t('settings.configureLink') : t('settings.initializeConnection')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <Card className="p-4 sm:p-8 border-border/50">
               <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 border-b border-border/50 pb-5">
                 <div className="flex-1">
                   <h3 className="text-lg sm:text-xl font-display font-semibold text-white">{t('settings.masterApiKeys')}</h3>
                   <p className="text-sm text-muted-foreground mt-1">{t('settings.apiKeysDesc')}</p>
                 </div>
                 <Button className="w-full sm:w-auto"><Key className="w-4 h-4 mr-2"/> {t('settings.generateKey')}</Button>
               </div>
               
               <div className="space-y-4">
                 <div className="bg-background border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-bold text-white">{t('settings.primaryKey')}</span>
                        <Badge variant="safe" className="text-[10px]">{t('settings.active')}</Badge>
                      </div>
                      <code className="text-xs sm:text-sm text-muted-foreground font-mono bg-secondary px-2 py-1 rounded break-all">dnrx_live_9a8b7c6d5e4f3g2h1i</code>
                    </div>
                    <Button variant="ghost" size="sm" className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-primary hover:text-primary self-start sm:self-auto">{t('settings.copyKey')}</Button>
                 </div>
                 
                 <div className="bg-background border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 opacity-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-bold text-white">{t('settings.legacyToken')}</span>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">{t('settings.revoked')}</Badge>
                      </div>
                      <code className="text-xs sm:text-sm text-muted-foreground font-mono bg-secondary px-2 py-1 rounded break-all">dnrx_old_********************</code>
                    </div>
                 </div>
               </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-8 border-border/50 flex items-center justify-center min-h-[300px]">
               <p className="text-muted-foreground flex items-center gap-2">
                 <Activity className="w-5 h-5 animate-pulse" /> {t('settings.routingDesc')}
               </p>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
