import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell, { StaggerChildren } from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import ExpandableScreenshot from '../components/ExpandableScreenshot';
import AgentInstallToolCard from '../components/AgentInstallToolCard';
import api from '../lib/api';
import {
  Download, ShieldCheck, Terminal, Globe, MessageSquare,
  CheckCircle2, ArrowLeft, AlertTriangle, UserCog,
} from 'lucide-react';

const STEP_COUNT = 6;

const STEP_SCREENS = {
  1: 'step1-download.jpg',
  2: 'step2-run-as-admin.jpg',
  3: 'step3-uac-yes.jpg',
  4: 'step4-install-progress.jpg',
  5: 'step5-cag-browser.jpg',
  6: 'step6-rocketchat.jpg',
};

const STEP_ICONS = [Download, UserCog, ShieldCheck, Terminal, Globe, MessageSquare];

const AgentFirstSetup = () => {
  const { t, language } = useLanguage();
  const lang = ['tr', 'de', 'en', 'fr', 'ka'].includes(language) ? language : 'de';
  const imgSrc = (file) => `${process.env.PUBLIC_URL}/agent-setup/${lang}/${file}`;
  const toolUrl = `${api.defaults.baseURL || ''}/api/tools/agent?lang=${lang}`;
  const downloadName = `DCS-Agent-Ilk-Kurulum-${lang}.cmd`;

  return (
    <PageShell
      theme="emerald"
      icon={UserCog}
      title={t('agentSetup.title')}
      subtitle={t('agentSetup.subtitle')}
    >
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm text-teal-700 hover:underline font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('agentSetup.backToHome')}
        </Link>
      </div>

      <Alert className="mb-6 border-2 border-teal-200 bg-teal-50/90">
        <AlertTriangle className="w-5 h-5 text-teal-700" />
        <AlertDescription className="ml-2 text-teal-950">
          <p className="font-semibold mb-1">{t('agentSetup.alertTitle')}</p>
          <p>{t('agentSetup.alertText')}</p>
        </AlertDescription>
      </Alert>

      <AgentInstallToolCard className="mb-6" />

      <div className="mb-6 text-center">
        <a href={toolUrl} download={downloadName}>
          <Button size="lg" variant="brand" className="bg-teal-600 hover:bg-teal-700 px-8">
            <Download className="w-5 h-5 mr-2" />
            {t('agentSetup.downloadButton')}
          </Button>
        </a>
      </div>

      <StaggerChildren>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6">
          {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((stepNum) => {
            const Icon = STEP_ICONS[stepNum - 1];
            const screenshot = STEP_SCREENS[stepNum];
            const stepTitle = t(`agentSetup.step${stepNum}.title`);
            const tip = t(`agentSetup.step${stepNum}.tip`);
            const hasTip = tip && tip !== `agentSetup.step${stepNum}.tip`;

            return (
              <Card
                key={stepNum}
                className="glass-panel border-0 overflow-hidden shadow-lg h-full flex flex-col"
              >
                <CardHeader className="bg-gradient-to-r from-teal-50/90 to-emerald-50/50 pb-3 pt-4 px-4">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-teal-600 text-white text-base px-2.5 py-0.5 shrink-0">
                      {stepNum}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-teal-700 shrink-0" />
                        <CardTitle className="text-base sm:text-lg leading-snug">{stepTitle}</CardTitle>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {t(`agentSetup.step${stepNum}.desc`)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 px-4 pb-4 flex-1 flex flex-col gap-3">
                  {screenshot && (
                    <ExpandableScreenshot
                      src={imgSrc(screenshot)}
                      alt={stepTitle}
                      title={stepTitle}
                      darkFrame={stepNum === 4}
                    />
                  )}
                  {hasTip && (
                    <p className="text-xs text-teal-800 bg-teal-50 rounded-lg p-2.5 border border-teal-100 mt-auto">
                      <strong>{t('agentSetup.tipLabel')}:</strong> {tip}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </StaggerChildren>

      <Card className="mt-8 border-2 border-green-200 bg-green-50/50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <p className="text-gray-700 font-medium">{t('agentSetup.footerNote')}</p>
          </div>
          <p className="text-sm text-gray-600 mb-4 max-w-2xl mx-auto">{t('agentSetup.footerHint')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={toolUrl} download={downloadName}>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                {t('agentSetup.downloadButton')}
              </Button>
            </a>
            <a href="https://rocket.dmc-rz.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-teal-300 text-teal-800">
                <MessageSquare className="w-4 h-4 mr-2" />
                Rocket.Chat
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default AgentFirstSetup;
