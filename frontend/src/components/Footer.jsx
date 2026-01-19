import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, MessageSquare } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo ve Başlık */}
          <div className="flex items-center space-x-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/5tfegwm3_image.png" 
              alt="DCS Logo" 
              className="h-16 w-auto"
            />
            <div>
              <h3 className="text-xl font-bold text-red-500">DCS Communication Center</h3>
              <p className="text-gray-400">{t('footer.support')}</p>
            </div>
          </div>
          
          {/* İletişim Bilgileri */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-red-500" />
              <a href="https://rocket.dmc-rz.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                rocket.dmc-rz.com / IT_Helpdesk Kanalı
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-red-500" />
              <a href="mailto:it@dcs-callcenter.de" className="text-gray-300 hover:text-white transition-colors">
                it@dcs-callcenter.de
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            {t('footer.rights')} | Bayram Can Aslan
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
