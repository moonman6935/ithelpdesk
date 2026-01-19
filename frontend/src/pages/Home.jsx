import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Monitor, Headphones, AlertCircle, ArrowRight } from 'lucide-react';

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 via-white to-red-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('home.welcome')}
            </h1>
            <p className="text-2xl text-red-600 font-semibold mb-4">
              {t('home.subtitle')}
            </p>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('home.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pc-setup">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg px-8 py-6 group">
                  {t('home.getStarted')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/headset-test">
                <Button size="lg" variant="outline" className="border-2 border-red-600 text-red-600 hover:bg-red-50 text-lg px-8 py-6">
                  {t('home.testHeadset')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Follow our comprehensive guide to set up your workstation</p>
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
