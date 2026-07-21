import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Wrench, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';

const TOOL_URL = `${process.env.PUBLIC_URL}/tools/DCS-Kulaklik-Onarim.cmd`;

const HeadsetRepairToolCard = ({ className = '' }) => {
  const { t } = useLanguage();

  const bullets = [
    t('headsetRepairTool.f1'),
    t('headsetRepairTool.f2'),
    t('headsetRepairTool.f3'),
    t('headsetRepairTool.f4'),
  ];

  return (
    <Card className={`overflow-hidden border-0 shadow-xl ${className}`}>
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="absolute -bottom-12 left-1/4 w-36 h-36 rounded-full bg-cyan-400/15 blur-2xl" />
        </div>

        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
                  <Wrench className="w-6 h-6 text-white" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-bold">{t('headsetRepairTool.title')}</h3>
                    <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-0">{t('headsetRepairTool.badge')}</Badge>
                  </div>
                  <p className="text-white/70 text-sm mt-0.5">{t('headsetRepairTool.subtitle')}</p>
                </div>
              </div>

              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/85">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4 mt-5 text-xs text-white/50">
                <span className="inline-flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> Windows 10 / 11</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> {t('headsetRepairTool.safe')}</span>
              </div>
            </div>

            <div className="md:w-64 shrink-0">
              <a href={TOOL_URL} download>
                <Button size="lg" className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg rounded-xl">
                  <Download className="w-5 h-5 mr-2" />
                  {t('headsetRepairTool.download')}
                </Button>
              </a>
              <p className="text-center text-white/50 text-xs mt-2">{t('headsetRepairTool.hint')}</p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default HeadsetRepairToolCard;
