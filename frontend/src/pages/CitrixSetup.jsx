import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Download, Monitor, CheckCircle2, RotateCcw, ExternalLink,
  FileDown, MousePointerClick, ShieldCheck, Play, ArrowLeft,
} from 'lucide-react';

const CITRIX_DOWNLOAD_URL =
  'https://www.citrix.com/downloads/workspace-app/windows/workspace-app-for-windows-latest.html';

const STEP_COUNT = 7;

function MockBrowser({ url, children }) {
  return (
    <div className="rounded-xl border-2 border-gray-200 overflow-hidden shadow-md bg-white">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-500 truncate font-mono border border-gray-200">
          {url}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MockInstaller({ title, progress = 65 }) {
  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-white p-6 shadow-md max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Monitor className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-gray-800">{title}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-gray-500 text-center">{progress}%</p>
    </div>
  );
}

const CitrixSetup = () => {
  const { t } = useLanguage();

  const icons = [ExternalLink, FileDown, MousePointerClick, Play, ShieldCheck, RotateCcw, CheckCircle2];

  return (
    <PageShell
      theme="cyan"
      icon={Monitor}
      title={t('citrixSetup.title')}
      subtitle={t('citrixSetup.subtitle')}
      maxWidth="max-w-4xl"
    >
      <div className="mb-6">
        <Link to="/faq" className="inline-flex items-center text-sm text-indigo-600 hover:underline font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('citrixSetup.backToFaq')}
        </Link>
      </div>

      <Alert className="mb-8 border-2 border-indigo-200 bg-indigo-50/90">
        <Download className="w-5 h-5 text-indigo-600" />
        <AlertDescription className="ml-2 text-indigo-900">
          <p className="font-semibold mb-1">{t('citrixSetup.alertTitle')}</p>
          <p>{t('citrixSetup.alertText')}</p>
        </AlertDescription>
      </Alert>

      <div className="mb-8 text-center">
        <a href={CITRIX_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
          <Button size="lg" variant="brand" className="bg-indigo-600 hover:bg-indigo-700 px-8">
            <ExternalLink className="w-5 h-5 mr-2" />
            {t('citrixSetup.openDownloadPage')}
          </Button>
        </a>
      </div>

      <div className="space-y-8">
        {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((stepNum) => {
          const Icon = icons[stepNum - 1];
          return (
            <Card key={stepNum} className="glass-panel border-0 overflow-hidden shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50/90 to-cyan-50/50 pb-4">
                <div className="flex items-start gap-4">
                  <Badge className="bg-indigo-600 text-white text-lg px-3 py-1 shrink-0">
                    {stepNum}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-indigo-600 shrink-0" />
                      <CardTitle className="text-xl">{t(`citrixSetup.step${stepNum}.title`)}</CardTitle>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {t(`citrixSetup.step${stepNum}.desc`)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {stepNum === 1 && (
                  <MockBrowser url="citrix.com/downloads/workspace-app/windows/...">
                    <p className="text-sm font-semibold text-gray-800 mb-3">{t('citrixSetup.step1.visualTitle')}</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
                        {t('citrixSetup.step1.visual1')}
                      </p>
                    </div>
                  </MockBrowser>
                )}

                {stepNum === 2 && (
                  <MockBrowser url="citrix.com/downloads/...">
                    <p className="text-sm font-semibold text-gray-800 mb-3">{t('citrixSetup.step2.visualTitle')}</p>
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50/50 space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">Citrix Workspace app — Offline installer</p>
                          <p className="text-xs text-gray-500">~790 MB · .exe</p>
                        </div>
                        <Badge className="bg-green-600 text-white shrink-0">{t('citrixSetup.offlineBadge')}</Badge>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                        <p className="font-medium text-amber-900 mb-2">{t('citrixSetup.eulaTitle')}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs pointer-events-none">
                            {t('citrixSetup.eulaAccept')}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs opacity-50 pointer-events-none">
                            {t('citrixSetup.eulaDecline')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </MockBrowser>
                )}

                {stepNum === 3 && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center animate-pulse">
                      <FileDown className="w-10 h-10 text-indigo-600" />
                    </div>
                    <p className="text-sm text-gray-600 font-mono bg-gray-100 px-4 py-2 rounded-lg">
                      CitrixWorkspaceApp.exe
                    </p>
                    <p className="text-xs text-gray-500">{t('citrixSetup.step3.hint')}</p>
                  </div>
                )}

                {stepNum === 4 && (
                  <div className="grid sm:grid-cols-3 gap-3 text-center text-sm">
                    {['next', 'accept', 'install'].map((key) => (
                      <div key={key} className="p-4 rounded-xl border-2 border-indigo-100 bg-white">
                        <MousePointerClick className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-800">{t(`citrixSetup.step4.${key}`)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {stepNum === 5 && (
                  <MockInstaller title={t('citrixSetup.step5.installerTitle')} progress={72} />
                )}

                {stepNum === 6 && (
                  <div className="text-center py-6">
                    <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                      <RotateCcw className="w-12 h-12 text-orange-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-800">{t('citrixSetup.step6.restartTitle')}</p>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">{t('citrixSetup.step6.restartDesc')}</p>
                  </div>
                )}

                {stepNum === 7 && (
                  <div className="text-center py-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <p className="text-xl font-bold text-green-800">{t('citrixSetup.step7.readyTitle')}</p>
                    <p className="text-gray-700 mt-2 max-w-lg mx-auto">{t('citrixSetup.step7.readyDesc')}</p>
                  </div>
                )}

                {(() => {
                  const tip = t(`citrixSetup.step${stepNum}.tip`);
                  if (!tip || tip === `citrixSetup.step${stepNum}.tip`) return null;
                  return (
                    <p className="mt-4 text-sm text-indigo-700 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                      <strong>{t('citrixSetup.tipLabel')}:</strong> {tip}
                    </p>
                  );
                })()}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-10 border-2 border-indigo-200 bg-indigo-50/50">
        <CardContent className="p-6 text-center">
          <p className="text-gray-700 mb-4">{t('citrixSetup.footerNote')}</p>
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
