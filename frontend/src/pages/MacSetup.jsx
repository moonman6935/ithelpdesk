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
  Download, ExternalLink, CheckCircle2, ArrowLeft, Laptop,
  MonitorSmartphone, FolderInput, KeyRound, FileDown, Play, PackageCheck,
} from 'lucide-react';

const ANYDESK_DOWNLOAD_URL = 'https://anydesk.com/en/downloads/mac-os';
const CITRIX_DOWNLOAD_URL =
  'https://www.citrix.com/downloads/workspace-app/mac/workspace-app-for-mac-latest.html';

const ANYDESK_STEPS = [
  { icon: FileDown, screen: 'mac-anydesk-download.png' },
  { icon: FolderInput, screen: 'mac-anydesk-install.png' },
  { icon: KeyRound, screen: 'mac-anydesk-id.png' },
];

const CITRIX_STEPS = [
  { icon: FileDown, screen: 'mac-citrix-download.png' },
  { icon: Play, screen: 'mac-citrix-installer.png' },
  { icon: PackageCheck, screen: 'mac-citrix-done.png' },
];

const MacSetup = () => {
  const { t } = useLanguage();
  const imgSrc = (file) => `${process.env.PUBLIC_URL}/mac-setup/${file}`;

  const renderSection = ({ keyPrefix, steps, accent, downloadUrl, downloadKey }) => (
    <section className="mb-12">
      <Card className={`glass-panel border-0 shadow-lg mb-6 ${accent.headerBg}`}>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${accent.iconBg} flex items-center justify-center shrink-0`}>
                <MonitorSmartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">{t(`${keyPrefix}.title`)}</CardTitle>
                <p className="text-gray-600 text-sm mt-1">{t(`${keyPrefix}.subtitle`)}</p>
              </div>
            </div>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button className={`${accent.button} text-white px-6`}>
                <Download className="w-4 h-4 mr-2" />
                {t(downloadKey)}
              </Button>
            </a>
          </div>
        </CardHeader>
      </Card>

      <StaggerChildren>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const Icon = step.icon;
            const stepTitle = t(`${keyPrefix}.step${stepNum}.title`);
            const tip = t(`${keyPrefix}.step${stepNum}.tip`);
            const hasTip = tip && tip !== `${keyPrefix}.step${stepNum}.tip`;

            return (
              <Card
                key={stepNum}
                className="glass-panel border-0 overflow-hidden shadow-lg h-full flex flex-col"
              >
                <CardHeader className={`${accent.headerBg} pb-3 pt-4 px-4`}>
                  <div className="flex items-start gap-3">
                    <Badge className={`${accent.button} text-white text-base px-2.5 py-0.5 shrink-0`}>
                      {stepNum}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${accent.text} shrink-0`} />
                        <CardTitle className="text-base sm:text-lg leading-snug">{stepTitle}</CardTitle>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {t(`${keyPrefix}.step${stepNum}.desc`)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 px-4 pb-4 flex-1 flex flex-col gap-3">
                  <ExpandableScreenshot
                    src={imgSrc(step.screen)}
                    alt={stepTitle}
                    title={stepTitle}
                  />
                  {hasTip && (
                    <p className={`text-xs ${accent.text} ${accent.tipBg} rounded-lg p-2.5 border ${accent.tipBorder} mt-auto`}>
                      <strong>{t('macSetup.tipLabel')}:</strong> {tip}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </StaggerChildren>
    </section>
  );

  return (
    <PageShell
      theme="slate"
      icon={Laptop}
      title={t('macSetup.title')}
      subtitle={t('macSetup.subtitle')}
    >
      <div className="mb-6">
        <Link to="/faq" className="inline-flex items-center text-sm text-indigo-600 hover:underline font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('macSetup.backToFaq')}
        </Link>
      </div>

      <Alert className="mb-8 border-2 border-slate-200 bg-slate-50/90">
        <Laptop className="w-5 h-5 text-slate-700" />
        <AlertDescription className="ml-2 text-slate-800">
          <p className="font-semibold mb-1">{t('macSetup.alertTitle')}</p>
          <p>{t('macSetup.alertText')}</p>
        </AlertDescription>
      </Alert>

      {renderSection({
        keyPrefix: 'macSetup.anydesk',
        steps: ANYDESK_STEPS,
        downloadUrl: ANYDESK_DOWNLOAD_URL,
        downloadKey: 'macSetup.anydesk.download',
        accent: {
          headerBg: 'bg-gradient-to-r from-red-50/90 to-orange-50/50',
          iconBg: 'bg-red-600',
          button: 'bg-red-600 hover:bg-red-700',
          text: 'text-red-700',
          tipBg: 'bg-red-50',
          tipBorder: 'border-red-100',
        },
      })}

      {renderSection({
        keyPrefix: 'macSetup.citrix',
        steps: CITRIX_STEPS,
        downloadUrl: CITRIX_DOWNLOAD_URL,
        downloadKey: 'macSetup.citrix.download',
        accent: {
          headerBg: 'bg-gradient-to-r from-indigo-50/90 to-cyan-50/50',
          iconBg: 'bg-indigo-600',
          button: 'bg-indigo-600 hover:bg-indigo-700',
          text: 'text-indigo-700',
          tipBg: 'bg-indigo-50',
          tipBorder: 'border-indigo-100',
        },
      })}

      <Card className="mt-2 border-2 border-emerald-200 bg-emerald-50/80">
        <CardContent className="pt-6 pb-6 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="font-semibold text-emerald-900">{t('macSetup.footerTitle')}</p>
          <p className="text-sm text-emerald-800 max-w-2xl mx-auto">{t('macSetup.footerText')}</p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <a href={ANYDESK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-red-300 text-red-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('macSetup.anydesk.download')}
              </Button>
            </a>
            <a href={CITRIX_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-indigo-300 text-indigo-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('macSetup.citrix.download')}
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default MacSetup;
