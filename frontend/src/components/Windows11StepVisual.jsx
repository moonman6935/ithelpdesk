import React from 'react';

function WinChrome({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl overflow-hidden border border-gray-300 shadow-lg bg-[#f3f3f3] ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-[#e8e8e8] border-b border-gray-300">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-gray-600 truncate">{title}</span>
      </div>
      <div className="p-4 sm:p-5 bg-white min-h-[180px]">{children}</div>
    </div>
  );
}

const Windows11StepVisual = ({ step, t }) => {
  if (step === 2) {
    return (
      <WinChrome title="Windows11InstallationAssistant.exe">
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow">
            11
          </div>
          <p className="text-sm font-semibold text-gray-800">{t('windows11Upgrade.visual.step2.title')}</p>
          <p className="text-xs text-gray-500 max-w-xs">{t('windows11Upgrade.visual.step2.desc')}</p>
          <div className="flex gap-2 mt-1">
            <span className="px-4 py-1.5 rounded bg-gray-200 text-gray-700 text-sm">{t('windows11Upgrade.visual.cancel')}</span>
            <span className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm font-medium shadow">
              {t('windows11Upgrade.visual.step2.run')}
            </span>
          </div>
        </div>
      </WinChrome>
    );
  }

  if (step === 3) {
    return (
      <WinChrome title={t('windows11Upgrade.visual.step3.windowTitle')}>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">{t('windows11Upgrade.visual.step3.title')}</p>
          <div className="h-24 rounded-lg border bg-gray-50 p-2 text-[10px] text-gray-500 leading-relaxed overflow-hidden">
            Microsoft Software License Terms… Windows 11…
          </div>
          <div className="flex justify-end">
            <span className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold shadow">
              {t('windows11Upgrade.visual.step3.accept')}
            </span>
          </div>
        </div>
      </WinChrome>
    );
  }

  if (step === 4) {
    return (
      <WinChrome title={t('windows11Upgrade.visual.step4.windowTitle')}>
        <div className="space-y-4 py-2">
          <p className="text-sm font-semibold text-gray-800">{t('windows11Upgrade.visual.step4.title')}</p>
          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" />
          </div>
          <p className="text-xs text-gray-500">{t('windows11Upgrade.visual.step4.desc')}</p>
        </div>
      </WinChrome>
    );
  }

  if (step === 5) {
    return (
      <WinChrome title={t('windows11Upgrade.visual.step5.windowTitle')}>
        <div className="flex flex-col items-center text-center gap-4 py-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">✓</div>
          <p className="text-sm font-semibold text-gray-800">{t('windows11Upgrade.visual.step5.title')}</p>
          <span className="px-5 py-2 rounded bg-blue-600 text-white text-sm font-semibold shadow">
            {t('windows11Upgrade.visual.step5.restart')}
          </span>
        </div>
      </WinChrome>
    );
  }

  if (step === 6) {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg bg-[#0078d4] text-white min-h-[200px] flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="w-10 h-10 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        <p className="text-lg font-light">{t('windows11Upgrade.visual.step6.title')}</p>
        <p className="text-sm text-blue-100 max-w-xs">{t('windows11Upgrade.visual.step6.desc')}</p>
        <p className="text-xs text-amber-200 font-medium mt-2">{t('windows11Upgrade.visual.step6.warning')}</p>
      </div>
    );
  }

  if (step === 7) {
    return (
      <WinChrome title={t('windows11Upgrade.visual.step7.windowTitle')}>
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-inner shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">Windows 11 Pro</p>
            <p className="text-gray-500 text-xs">Version 25H2</p>
            <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-xs font-medium">
              {t('windows11Upgrade.visual.step7.badge')}
            </div>
          </div>
        </div>
      </WinChrome>
    );
  }

  return null;
};

export default Windows11StepVisual;
