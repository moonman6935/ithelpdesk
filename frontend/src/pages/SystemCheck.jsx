import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import {
  Gauge,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  Wifi,
  Upload,
  Download,
  Laptop,
  Info,
} from 'lucide-react';
import {
  SYSTEM_MIN,
  collectAutoProbes,
  evaluateSystemCheck,
} from '../lib/systemCheck';
import { runSpeedTests } from '../lib/systemCheckSpeed';

const YES_NO = [
  { value: '', labelKey: 'systemCheck.selectPlaceholder' },
  { value: 'yes', labelKey: 'systemCheck.yes' },
  { value: 'no', labelKey: 'systemCheck.no' },
];

const OS_OPTIONS = [
  { value: '', labelKey: 'systemCheck.selectPlaceholder' },
  { value: 'windows11', labelKey: 'systemCheck.osWin11' },
  { value: 'windows10', labelKey: 'systemCheck.osWin10' },
  { value: 'other', labelKey: 'systemCheck.osOther' },
];

function statusStyles(status) {
  if (status === 'pass') {
    return {
      band: 'from-emerald-500 via-green-600 to-teal-700',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
    };
  }
  if (status === 'warn') {
    return {
      band: 'from-amber-500 via-orange-500 to-orange-700',
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      Icon: AlertTriangle,
    };
  }
  return {
    band: 'from-red-500 via-rose-600 to-red-800',
    badge: 'bg-red-100 text-red-800 border-red-200',
    Icon: XCircle,
  };
}

function checkIcon(id) {
  const map = {
    os: Laptop,
    cpu: Cpu,
    ram: MemoryStick,
    disk: HardDrive,
    gpu: Monitor,
    download: Download,
    upload: Upload,
  };
  return map[id] || Info;
}

function formatCheckValue(id, value, t) {
  if (id === 'os') {
    if (value === 'windows11') return t('systemCheck.osWin11');
    if (value === 'windows10') return t('systemCheck.osWin10');
    if (value === 'other') return t('systemCheck.osOther');
    return t('systemCheck.unknown');
  }
  if (id === 'cpu') {
    return value === SYSTEM_MIN.cpuLabel ? t('systemCheck.cpuOkValue') : t('systemCheck.cpuFailValue');
  }
  if (id === 'ram') {
    if (typeof value === 'number') return `${value} GB`;
    if (value === 'manual-ok') return t('systemCheck.ramManualOk');
    if (value === 'manual-fail') return t('systemCheck.ramManualFail');
    return t('systemCheck.unknown');
  }
  if (id === 'disk') {
    return value?.startsWith('ssd') ? t('systemCheck.diskOkValue') : t('systemCheck.diskFailValue');
  }
  if (id === 'gpu') {
    return value?.startsWith('vram') ? t('systemCheck.gpuOkValue') : t('systemCheck.gpuFailValue');
  }
  if (id === 'download' || id === 'upload') {
    if (typeof value === 'number') return `${value} Mbps`;
    return t('systemCheck.unknown');
  }
  return String(value ?? t('systemCheck.unknown'));
}

const SystemCheck = () => {
  const { t } = useLanguage();
  const [probes, setProbes] = useState(null);
  const [osSelect, setOsSelect] = useState('');
  const [cpuSelect, setCpuSelect] = useState('');
  const [ramSelect, setRamSelect] = useState('');
  const [diskSelect, setDiskSelect] = useState('');
  const [gpuSelect, setGpuSelect] = useState('');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [liveMbps, setLiveMbps] = useState(null);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const auto = await collectAutoProbes();
        if (cancelled) return;
        setProbes(auto);
        if (auto.os === 'windows11' || auto.os === 'windows10' || auto.os === 'other') {
          setOsSelect(auto.os);
        }
        if (typeof auto.ramGb === 'number' && auto.ramGb >= SYSTEM_MIN.ramGb) {
          setRamSelect('yes');
        } else if (typeof auto.ramGb === 'number' && auto.ramGb < SYSTEM_MIN.ramGb) {
          setRamSelect('no');
        }
      } catch {
        if (!cancelled) setProbes({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const needsRamManual = !(typeof probes?.ramGb === 'number' && probes.ramGb > 0);
  const needsOsManual = !osSelect || probes?.os === 'unknown';

  const canStart =
    osSelect &&
    cpuSelect &&
    diskSelect &&
    gpuSelect &&
    (needsRamManual ? !!ramSelect : true) &&
    !running;

  const runCheck = async () => {
    if (!canStart) {
      setError(t('systemCheck.fillAll'));
      return;
    }
    setError('');
    setReport(null);
    setRunning(true);
    setPhase('download');
    setProgress(0);
    setLiveMbps(null);

    try {
      const speed = await runSpeedTests(({ phase: p, progress: pr, mbps }) => {
        setPhase(p);
        setProgress(pr || 0);
        setLiveMbps(mbps);
      });

      const ramGb = typeof probes?.ramGb === 'number' ? probes.ramGb : null;
      const result = evaluateSystemCheck({
        os: osSelect,
        cpuOk: cpuSelect === 'yes',
        ramGb,
        ramOkManual: ramGb == null ? ramSelect === 'yes' : null,
        diskOk: diskSelect === 'yes',
        gpuVramOk: gpuSelect === 'yes',
        downloadMbps: speed.downloadMbps,
        uploadMbps: speed.uploadMbps,
      });

      setReport({
        ...result,
        speed,
        probes,
        gpuName: probes?.gpuName,
      });
    } catch (err) {
      setError(t('systemCheck.speedError'));
    } finally {
      setRunning(false);
      setPhase('');
      setProgress(0);
      setLiveMbps(null);
    }
  };

  const styles = report ? statusStyles(report.status) : null;
  const StatusIcon = styles?.Icon;

  return (
    <PageShell
      theme="slate"
      icon={Gauge}
      title={t('systemCheck.title')}
      subtitle={t('systemCheck.subtitle')}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('systemCheck.requirementsTitle')}</CardTitle>
            <CardDescription>{t('systemCheck.requirementsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" /> {t('systemCheck.reqCpu')}
              </li>
              <li className="flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-slate-500" /> {t('systemCheck.reqRam')}
              </li>
              <li className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-500" /> {t('systemCheck.reqDisk')}
              </li>
              <li className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-500" /> {t('systemCheck.reqGpu')}
              </li>
              <li className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-slate-500" /> {t('systemCheck.reqOs')}
              </li>
              <li className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-slate-500" /> {t('systemCheck.reqNet')}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('systemCheck.formTitle')}</CardTitle>
            <CardDescription>{t('systemCheck.formDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {probes && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">{t('systemCheck.autoTitle')}</p>
                <p>
                  {t('systemCheck.autoOs')}:{' '}
                  {probes.os === 'windows11'
                    ? t('systemCheck.osWin11')
                    : probes.os === 'windows10'
                      ? t('systemCheck.osWin10')
                      : probes.os === 'other'
                        ? t('systemCheck.osOther')
                        : t('systemCheck.unknown')}
                </p>
                <p>
                  {t('systemCheck.autoRam')}:{' '}
                  {typeof probes.ramGb === 'number' ? `${probes.ramGb} GB` : t('systemCheck.unknown')}
                </p>
                <p>
                  {t('systemCheck.autoCores')}:{' '}
                  {probes.cpuCores != null ? probes.cpuCores : t('systemCheck.unknown')}
                </p>
                <p className="break-all">
                  {t('systemCheck.autoGpu')}: {probes.gpuName || t('systemCheck.unknown')}
                </p>
                {probes.storageEstimateGb != null && (
                  <p>
                    {t('systemCheck.autoStorage')}: ~{probes.storageEstimateGb} GB
                  </p>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium text-gray-800 mb-1 block">{t('systemCheck.fieldOs')}</span>
                <select
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                  value={osSelect}
                  onChange={(e) => setOsSelect(e.target.value)}
                  disabled={running}
                >
                  {OS_OPTIONS.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
                {needsOsManual && (
                  <span className="text-xs text-amber-700 mt-1 block">{t('systemCheck.osConfirmHint')}</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="font-medium text-gray-800 mb-1 block">{t('systemCheck.fieldCpu')}</span>
                <select
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                  value={cpuSelect}
                  onChange={(e) => setCpuSelect(e.target.value)}
                  disabled={running}
                >
                  {YES_NO.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500 mt-1 block">{t('systemCheck.fieldCpuHint')}</span>
              </label>

              {needsRamManual && (
                <label className="block text-sm">
                  <span className="font-medium text-gray-800 mb-1 block">{t('systemCheck.fieldRam')}</span>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                    value={ramSelect}
                    onChange={(e) => setRamSelect(e.target.value)}
                    disabled={running}
                  >
                    {YES_NO.map((o) => (
                      <option key={o.value || 'empty'} value={o.value}>
                        {t(o.labelKey)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block text-sm">
                <span className="font-medium text-gray-800 mb-1 block">{t('systemCheck.fieldDisk')}</span>
                <select
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                  value={diskSelect}
                  onChange={(e) => setDiskSelect(e.target.value)}
                  disabled={running}
                >
                  {YES_NO.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500 mt-1 block">{t('systemCheck.fieldDiskHint')}</span>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-gray-800 mb-1 block">{t('systemCheck.fieldGpu')}</span>
                <select
                  className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                  value={gpuSelect}
                  onChange={(e) => setGpuSelect(e.target.value)}
                  disabled={running}
                >
                  {YES_NO.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500 mt-1 block">{t('systemCheck.fieldGpuHint')}</span>
              </label>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {running && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-sm font-medium text-gray-800">
                  {phase === 'upload' ? t('systemCheck.testingUpload') : t('systemCheck.testingDownload')}
                </p>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-slate-700 transition-all duration-200"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                {liveMbps != null && (
                  <p className="text-xs text-gray-500">
                    ~{Math.round(liveMbps * 10) / 10} Mbps
                  </p>
                )}
              </div>
            )}

            <Button
              size="lg"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900"
              onClick={runCheck}
              disabled={!canStart}
            >
              <Gauge className="w-5 h-5 mr-2" />
              {running ? t('systemCheck.running') : t('systemCheck.start')}
            </Button>
          </CardContent>
        </Card>

        {report && styles && (
          <div className="space-y-4">
            <div
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${styles.band} text-white shadow-xl p-8`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <StatusIcon className="w-14 h-14 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-wide text-white/80 mb-1">
                    {t('systemCheck.reportTitle')}
                  </p>
                  <h2 className="text-3xl font-bold">
                    {report.status === 'pass'
                      ? t('systemCheck.verdictPass')
                      : report.status === 'warn'
                        ? t('systemCheck.verdictWarn')
                        : t('systemCheck.verdictFail')}
                  </h2>
                  <p className="text-white/90 mt-2">
                    {report.status === 'pass'
                      ? t('systemCheck.verdictPassDesc')
                      : report.status === 'warn'
                        ? t('systemCheck.verdictWarnDesc')
                        : t('systemCheck.verdictFailDesc')}
                  </p>
                </div>
              </div>

              {report.status === 'warn' && (
                <div className="mt-6">
                  <Link to="/windows-11-upgrade">
                    <Button size="lg" className="bg-white text-orange-700 hover:bg-orange-50">
                      {t('systemCheck.goWin11')}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {report.failReasons?.length > 0 && report.status === 'fail' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription>
                  <p className="font-semibold text-red-900 mb-2">{t('systemCheck.reasonsTitle')}</p>
                  <ul className="list-disc pl-5 space-y-1 text-red-800 text-sm">
                    {report.failReasons.map((id) => (
                      <li key={id}>{t(`systemCheck.reason.${id}`)}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t('systemCheck.detailsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.checks.map((c) => {
                  const Icon = checkIcon(c.id);
                  const ok = c.pass || c.warn;
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          c.pass
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.warn
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{t(`systemCheck.check.${c.id}`)}</p>
                          <Badge className={statusStyles(c.pass ? 'pass' : c.warn ? 'warn' : 'fail').badge}>
                            {c.pass
                              ? t('systemCheck.ok')
                              : c.warn
                                ? t('systemCheck.warn')
                                : t('systemCheck.fail')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {formatCheckValue(c.id, c.value, t)}
                          {c.id === 'download' || c.id === 'upload'
                            ? ` · ${t('systemCheck.min')}: ${c.required} Mbps`
                            : null}
                        </p>
                      </div>
                      {ok && c.pass ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : c.warn ? (
                        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <p className="text-xs text-gray-500 text-center">{t('systemCheck.tpmNote')}</p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default SystemCheck;
