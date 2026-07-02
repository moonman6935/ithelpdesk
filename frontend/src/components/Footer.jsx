import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, MessageSquare } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="px-4 pb-6 pt-4 mt-auto">
      <div className="container mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-gray-900 to-slate-900 text-white shadow-xl border border-white/10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 right-10 w-40 h-40 rounded-full bg-red-500/10 blur-2xl" />
            <div className="absolute bottom-0 left-10 w-32 h-32 rounded-full bg-violet-500/10 blur-xl" />
          </div>

          <div className="relative px-6 py-8 md:px-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <BrandLogo variant="light" className="h-10 sm:h-11 w-auto shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-red-400">DCS Communication Center</h3>
                  <p className="text-gray-400">{t('footer.support')}</p>
                </div>
              </div>

              <div className="space-y-3 text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end space-x-3">
                  <MessageSquare className="w-5 h-5 text-red-400 shrink-0" />
                  <a
                    href="https://rocket.dmc-rz.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    rocket.dmc-rz.com / IT_Helpdesk Kanalı
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-end space-x-3">
                  <Mail className="w-5 h-5 text-red-400 shrink-0" />
                  <a
                    href="mailto:it@dcs-callcenter.de"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    it@dcs-callcenter.de
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm text-center md:text-left">
                {t('footer.rights')} | Bayram Can Aslan
              </p>
              <BrandLogo variant="muted" className="h-7 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
