import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, Phone } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-red-500 mb-4">DCS Communication Center</h3>
            <p className="text-gray-400">{t('footer.support')}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('footer.contact')}</h4>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>it-support@dcs.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+49 123 456 7890</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('header.title')}</h4>
            <p className="text-gray-400 text-sm">{t('footer.rights')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
