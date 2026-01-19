import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Monitor, Cable, Keyboard, Headphones, Power, Settings } from 'lucide-react';

const PCSetup = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Monitor,
      title: t('pcSetup.step1.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">{t('pcSetup.step1.desc')}</p>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{t('pcSetup.step1.item1')}</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{t('pcSetup.step1.item2')}</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{t('pcSetup.step1.item3')}</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{t('pcSetup.step1.item4')}</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{t('pcSetup.step1.item5')}</span>
            </li>
          </ul>
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-semibold">{t('pcSetup.step1.warning')}</p>
            </div>
          </div>
          <div className="mt-6">
            <img 
              src="https://images.pexels.com/photos/326501/pexels-photo-326501.jpeg" 
              alt="PC Components"
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      )
    },
    {
      icon: Cable,
      title: t('pcSetup.step2.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step2.desc')}</p>
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step2.instruction1')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step2.instruction2')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">3</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step2.instruction3')}</p>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800"><strong>💡 {t('pcSetup.step2.tip')}</strong></p>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <img 
              src="https://images.pexels.com/photos/4065718/pexels-photo-4065718.jpeg" 
              alt="PC Back Panel VGA"
              className="w-full h-48 object-cover rounded-lg shadow-lg"
            />
            <img 
              src="https://images.pexels.com/photos/2881228/pexels-photo-2881228.jpeg" 
              alt="VGA and HDMI Cables"
              className="w-full h-48 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      )
    },
    {
      icon: Cable,
      title: t('pcSetup.step3.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step3.desc')}</p>
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step3.instruction1')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step3.instruction2')}</p>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800"><strong>💡 {t('pcSetup.step3.tip')}</strong></p>
          </div>
          <div className="mt-6">
            <img 
              src="https://images.pexels.com/photos/12997230/pexels-photo-12997230.jpeg" 
              alt="HDMI Connection"
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      )
    },
    {
      icon: Keyboard,
      title: t('pcSetup.step4.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step4.desc')}</p>
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step4.instruction1')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step4.instruction2')}</p>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800"><strong>💡 {t('pcSetup.step4.tip')}</strong></p>
          </div>
          <div className="mt-6">
            <img 
              src="https://images.unsplash.com/photo-1674471361344-209ca7fbfbf1" 
              alt="Keyboard and Mouse"
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      )
    },
    {
      icon: Headphones,
      title: t('pcSetup.step5.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step5.desc')}</p>
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step5.instruction1')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
              <p className="text-gray-700 flex-1 font-semibold text-red-600">{t('pcSetup.step5.instruction2')}</p>
            </div>
          </div>
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-semibold">{t('pcSetup.step5.warning')}</p>
            </div>
          </div>
          <div className="mt-6">
            <img 
              src="https://images.pexels.com/photos/3892372/pexels-photo-3892372.jpeg" 
              alt="USB Headset"
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      )
    },
    {
      icon: Power,
      title: t('pcSetup.step6.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step6.desc')}</p>
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step6.instruction1')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step6.instruction2')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">3</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step6.instruction3')}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Settings,
      title: t('pcSetup.step7.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step7.desc')}</p>
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
              <p className="text-gray-700 flex-1">
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded text-sm">WIN</kbd> + 
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded text-sm ml-2">P</kbd>
                <br />
                {t('pcSetup.step7.instruction1')}
              </p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step7.instruction2')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">3</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step7.instruction3')}</p>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800"><strong>💡 {t('pcSetup.step7.tip')}</strong></p>
          </div>
        </div>
      )
    }
  ];

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center">
            {t('pcSetup.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 text-center">
            {t('pcSetup.subtitle')}
          </p>

          <Tabs defaultValue="interactive" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="interactive" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                {t('pcSetup.interactive')}
              </TabsTrigger>
              <TabsTrigger value="scroll" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                {t('pcSetup.scrollView')}
              </TabsTrigger>
            </TabsList>

            {/* Interactive Guide */}
            <TabsContent value="interactive">
              <Card className="border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-red-50 to-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                      <StepIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-red-600 text-white mb-2">Step {currentStep + 1} / {steps.length}</Badge>
                      <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {steps[currentStep].content}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200">
                    <Button
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                      variant="outline"
                      className="border-2 border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      {t('pcSetup.previous')}
                    </Button>
                    {currentStep < steps.length - 1 ? (
                      <Button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('pcSetup.next')}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <Button className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 w-4 h-4" />
                        {t('pcSetup.complete')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Indicator */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-red-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Scroll View - All Steps */}
            <TabsContent value="scroll">
              <div className="space-y-8">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <Card key={index} className="border-2 border-gray-200 hover:border-red-500 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-red-50 to-white">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <Badge className="bg-red-600 text-white mb-2">Step {index + 1}</Badge>
                            <CardTitle className="text-2xl">{step.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {step.content}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PCSetup;
