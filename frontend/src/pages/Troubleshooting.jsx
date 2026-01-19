import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Volume2, Mic, Monitor, Settings, AlertTriangle } from 'lucide-react';

const Troubleshooting = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('troubleshooting.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('troubleshooting.subtitle')}
            </p>
          </div>

          {/* Common Issues Accordion */}
          <Card className="mb-8 border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white">
              <CardTitle className="text-2xl">Common Issues</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {/* No Sound Issue */}
                <AccordionItem value="item-1" className="border-2 border-gray-200 rounded-lg mb-4 px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-lg font-semibold">{t('troubleshooting.noSound.title')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">1</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.noSound.solution1')}</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">2</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.noSound.solution2')}</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">3</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.noSound.solution3')}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Microphone Issue */}
                <AccordionItem value="item-2" className="border-2 border-gray-200 rounded-lg mb-4 px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Mic className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-lg font-semibold">{t('troubleshooting.noMic.title')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">1</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.noMic.solution1')}</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">2</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.noMic.solution2')}</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">3</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.noMic.solution3')}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Display Issue */}
                <AccordionItem value="item-3" className="border-2 border-gray-200 rounded-lg mb-4 px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-lg font-semibold">{t('troubleshooting.displayIssue.title')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">1</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.displayIssue.solution1')}</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">2</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.displayIssue.solution2')}</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                        <div className="flex items-start space-x-3">
                          <Badge className="bg-red-600 text-white">3</Badge>
                          <p className="text-gray-700 flex-1">{t('troubleshooting.displayIssue.solution3')}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Windows Sound Settings Guide */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{t('troubleshooting.soundSettings.title')}</CardTitle>
                  <CardDescription className="text-base">Step-by-step guide</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                  <div className="flex items-start space-x-4 mb-4">
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
                    <p className="text-gray-700 flex-1 text-lg">{t('troubleshooting.soundSettings.step1')}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                  <div className="flex items-start space-x-4 mb-4">
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
                    <p className="text-gray-700 flex-1 text-lg">{t('troubleshooting.soundSettings.step2')}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                  <div className="flex items-start space-x-4 mb-4">
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">3</Badge>
                    <p className="text-gray-700 flex-1 text-lg">{t('troubleshooting.soundSettings.step3')}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                  <div className="flex items-start space-x-4 mb-4">
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">4</Badge>
                    <p className="text-gray-700 flex-1 text-lg">{t('troubleshooting.soundSettings.step4')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Alert */}
          <Alert className="mt-8 border-2 border-red-500 bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <AlertDescription className="ml-2">
              <p className="font-semibold text-red-800 mb-2">{t('pcSetup.step5.warning')}</p>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                <li>USB kulaklık ARKA panel USB portuna takılmalıdır</li>
                <li>Jack (3.5mm) kulaklık KULLANMAYIN</li>
                <li>Bluetooth kulaklık KULLANMAYIN</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default Troubleshooting;
