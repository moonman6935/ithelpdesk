import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Monitor, Headphones, AlertCircle, ArrowRight } from 'lucide-react';
import HomeHeroCarousel from '../components/HomeHeroCarousel';

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <HomeHeroCarousel />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* PC Setup Card */}
            <Card className="border-2 border-gray-200 hover:border-red-500 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300">
                  <Monitor className="w-8 h-8 text-red-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-2xl">{t('home.features.setup')}</CardTitle>
                <CardDescription className="text-base">
                  {t('home.features.setupDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/pc-setup">
                  <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full">
                    {t('home.getStarted')} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Headset Test Card */}
            <Card className="border-2 border-gray-200 hover:border-red-500 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300">
                  <Headphones className="w-8 h-8 text-red-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-2xl">{t('home.features.test')}</CardTitle>
                <CardDescription className="text-base">
                  {t('home.features.testDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/headset-test">
                  <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full">
                    {t('home.testHeadset')} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Troubleshooting Card */}
            <Card className="border-2 border-gray-200 hover:border-red-500 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300">
                  <AlertCircle className="w-8 h-8 text-red-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-2xl">{t('home.features.support')}</CardTitle>
                <CardDescription className="text-base">
                  {t('home.features.supportDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/troubleshooting">
                  <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full">
                    {t('header.troubleshooting')} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('home.getStarted')}</h2>
          <p className="text-xl mb-8 opacity-90">{t('home.description')}</p>
          <Link to="/pc-setup">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-6">
              {t('home.getStarted')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
