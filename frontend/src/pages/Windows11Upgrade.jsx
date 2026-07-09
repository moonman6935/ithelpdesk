import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell, { StaggerChildren } from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import ExpandableScreenshot from '../components/ExpandableScreenshot';
import {
  Download, ExternalLink, CheckCircle2, AlertTriangle, HardDrive,
  ShieldCheck, RotateCcw, Play, FileCheck, Monitor, ArrowLeft, Laptop, Cpu, MemoryStick,
} from 'lucide-react';

const MICROSOFT_DOWNLOAD_URL = 'https://www.microsoft.com/tr-tr/software-download/windows11';
const MICROSOFT_SPECS_URL = 'https://www.microsoft.com/tr-tr/windows/windows-11-specifications';

const STEP_COUNT = 7;

const STEP_SCREENS = {
  1: 'step1-download.png',
  2: 'step2-uac.png',
  3: 'step3-accept.png',
  4: 'step4-download.png',
  5: 'step5-restart.png',
  6: 'step6-installing.png',
  7: 'step7-desktop.png',
};

const STEP_ICONS = [Download, Play, FileCheck, HardDrive, RotateCcw, Monitor, CheckCircle2];

const Windows11Upgrade = () => {
  const { t } = useLanguage();
  const imgSrc = (file) => `${process.env.PUBLIC_URL}/windows11-upgrade/${file}`;

  const prerequisites = [
    { icon: Cpu, text: t('windows11Upgrade.prereq.cpu') },
    { icon: MemoryStick, text: t('windows11Upgrade.prereq.ram') },
    { icon: HardDrive, text: t('windows11Upgrade.prereq.storage') },
    { icon: ShieldCheck, text: t('windows11Upgrade.prereq.tpm') },
    { icon: ShieldCheck, text: t('windows11Upgrade.prereq.secureBoot') },
    { icon: Monitor, text: t('windows11Upgrade.prereq.graphics') },
    { icon: Laptop, text: t('windows11Upgrade.prereq.display') },
    { icon: Monitor, text: t('windows11Upgrade.prereq.version') },
  ];

  return (
    <PageShell
      theme="blue"
      icon={Laptop}
      title={t('windows11Upgrade.title')}
      subtitle={t('windows11Upgrade.subtitle')}
    >
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:underline font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('windows11Upgrade.backToHome')}
        </Link>
      </div>

      <Alert className="mb-6 border-2 border-blue-200 bg-blue-50/90">
        <AlertTriangle className="w-5 h-5 text-blue-600" />
        <AlertDescription className="ml-2 text-blue-900">
          <p className="font-semibold mb-1">{t('windows11Upgrade.alertTitle')}</p>
          <p>{t('windows11Upgrade.alertText')}</p>
        </AlertDescription>
      </Alert>

      <Card className="glass-panel border-0 shadow-lg mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            {t('windows11Upgrade.prereqTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prerequisites.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 bg-white/80 rounded-lg border p-3 text-sm text-gray-700">
                <Icon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600">{t('windows11Upgrade.prereqNote')}</p>
          <div className="flex flex-wrap gap-3">
            <a href={MICROSOFT_SPECS_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-blue-300 text-blue-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('windows11Upgrade.checkRequirements')}
              </Button>
            </a>
            <a href={MICROSOFT_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                {t('windows11Upgrade.openDownloadPage')}
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <StaggerChildren>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6">
          {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((stepNum) => {
            const Icon = STEP_ICONS[stepNum - 1];
            const screenshot = STEP_SCREENS[stepNum];
            const stepTitle = t(`windows11Upgrade.step${stepNum}.title`);
            const tip = t(`windows11Upgrade.step${stepNum}.tip`);
            const hasTip = tip && tip !== `windows11Upgrade.step${stepNum}.tip`;

            return (
              <Card
                key={stepNum}
                className="glass-panel border-0 overflow-hidden shadow-lg h-full flex flex-col"
              >
                <CardHeader className="bg-gradient-to-r from-blue-50/90 to-sky-50/50 pb-3 pt-4 px-4">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600 text-white text-base px-2.5 py-0.5 shrink-0">
                      {stepNum}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                        <CardTitle className="text-base sm:text-lg leading-snug">{stepTitle}</CardTitle>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {t(`windows11Upgrade.step${stepNum}.desc`)}
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
                      darkFrame={stepNum === 6}
                    />
                  )}

                  {hasTip && (
                    <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2.5 border border-blue-100 mt-auto">
                      <strong>{t('windows11Upgrade.tipLabel')}:</strong> {tip}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </StaggerChildren>

      <Card className="mt-8 border-2 border-emerald-200 bg-emerald-50/80">
        <CardContent className="pt-6 pb-6 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="font-semibold text-emerald-900">{t('windows11Upgrade.footerTitle')}</p>
          <p className="text-sm text-emerald-800 max-w-2xl mx-auto">{t('windows11Upgrade.footerText')}</p>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default Windows11Upgrade;
