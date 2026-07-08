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
  Download, Monitor, CheckCircle2, RotateCcw, ExternalLink,
  FileDown, MousePointerClick, ShieldCheck, Play, ArrowLeft,
} from 'lucide-react';

const CITRIX_DOWNLOAD_URL =
  'https://www.citrix.com/downloads/workspace-app/windows/workspace-app-for-windows-latest.html';

const STEP_COUNT = 7;

const STEP_SCREENS = {
  1: 'step1-eula-download.png',
  2: 'step2-download-progress.png',
  3: 'step3-prerequisites.png',
  4: 'step4-welcome.png',
  5: 'step5-license.png',
  6: 'step6-installing.png',
  7: 'step7-success-reboot.png',
};

const CitrixSetup = () => {
  const { t } = useLanguage();

  const icons = [ExternalLink, FileDown, Play, MousePointerClick, ShieldCheck, Monitor, RotateCcw];

  const imgSrc = (file) => `${process.env.PUBLIC_URL}/citrix-setup/${file}`;

  return (
    <PageShell
      theme="cyan"
      icon={Monitor}
      title={t('citrixSetup.title')}
      subtitle={t('citrixSetup.subtitle')}
    >
      <div className="mb-6">
        <Link to="/faq" className="inline-flex items-center text-sm text-indigo-600 hover:underline font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('citrixSetup.backToFaq')}
        </Link>
      </div>

      <Alert className="mb-6 border-2 border-indigo-200 bg-indigo-50/90">
        <Download className="w-5 h-5 text-indigo-600" />
        <AlertDescription className="ml-2 text-indigo-900">
          <p className="font-semibold mb-1">{t('citrixSetup.alertTitle')}</p>
          <p>{t('citrixSetup.alertText')}</p>
        </AlertDescription>
      </Alert>

      <div className="mb-6 text-center">
        <a href={CITRIX_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
          <Button size="lg" variant="brand" className="bg-indigo-600 hover:bg-indigo-700 px-8">
            <ExternalLink className="w-5 h-5 mr-2" />
            {t('citrixSetup.openDownloadPage')}
          </Button>
        </a>
      </div>

      <StaggerChildren>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6">
          {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((stepNum) => {
            const Icon = icons[stepNum - 1];
            const screenshot = STEP_SCREENS[stepNum];
            const stepTitle = t(`citrixSetup.step${stepNum}.title`);
            const tip = t(`citrixSetup.step${stepNum}.tip`);
            const hasTip = tip && tip !== `citrixSetup.step${stepNum}.tip`;
            const isInstaller = stepNum >= 3;

            return (
              <Card
                key={stepNum}
                className="glass-panel border-0 overflow-hidden shadow-lg h-full flex flex-col"
              >
                <CardHeader className="bg-gradient-to-r from-indigo-50/90 to-cyan-50/50 pb-3 pt-4 px-4">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-indigo-600 text-white text-base px-2.5 py-0.5 shrink-0">
                      {stepNum}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <CardTitle className="text-base sm:text-lg leading-snug">{stepTitle}</CardTitle>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {t(`citrixSetup.step${stepNum}.desc`)}
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
                      darkFrame={isInstaller}
                    />
                  )}

                  {hasTip && (
                    <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg p-2.5 border border-indigo-100 mt-auto">
                      <strong>{t('citrixSetup.tipLabel')}:</strong> {tip}
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <p className="text-gray-700 font-medium">{t('citrixSetup.footerNote')}</p>
          </div>
          <a href={CITRIX_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-indigo-300 text-indigo-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('citrixSetup.openDownloadPage')}
            </Button>
          </a>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default CitrixSetup;
