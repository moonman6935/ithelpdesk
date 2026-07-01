import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { AlertCircle, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Cable, Monitor, Plug, Usb } from 'lucide-react';
import ConnectionDiagram from '../components/ConnectionDiagram';
import CompletionScreen from '../components/CompletionScreen';
import PageShell from '../components/PageShell';

const PCSetup = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const steps = [
    {
      icon: AlertTriangle,
      title: t('pcSetup.important'),
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-600 rounded-lg p-6">
            <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              {t('pcSetup.step0.title')}
            </h3>
            <ul className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <li key={num} className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">{t(`pcSetup.step0.item${num}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Cable,
      title: t('pcSetup.step1.title'),
      content: (
        <div className="space-y-6">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step1.desc')}</p>
          
          {/* Güç Kablosu */}
          <div className="bg-white border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-4 mb-3">
              <Plug className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">{t('pcSetup.step1.powerCable')}</h4>
                <p className="text-gray-700 mt-2">{t('pcSetup.step1.powerDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/ndprhb1q_image.png" alt="Güç Kablosu" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">Güç Kablosu</p>
              </div>
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/4bye9ldu_image.png" alt="Güç Girişi" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">Güç Girişi</p>
              </div>
            </div>
          </div>

          {/* VGA Kablosu */}
          <div className="bg-white border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-4 mb-3">
              <Cable className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">{t('pcSetup.step1.vgaCable')}</h4>
                <p className="text-gray-700 mt-2">{t('pcSetup.step1.vgaDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/xyhuazy5_image.png" alt="VGA Kablo" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">VGA Kablo</p>
              </div>
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/oz6wiwdy_image.png" alt="VGA Girişi" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">VGA Girişi</p>
              </div>
            </div>
          </div>

          {/* HDMI Kablo */}
          <div className="bg-white border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-4 mb-3">
              <Cable className="w-8 h-8 text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">{t('pcSetup.step1.hdmiCable')}</h4>
                <p className="text-gray-700 mt-2">{t('pcSetup.step1.hdmiDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/mv4phmml_image.png" alt="HDMI Kablo" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">HDMI Kablo</p>
              </div>
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/4iongkwu_image.png" alt="HDMI Girişi" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">HDMI Girişi</p>
              </div>
            </div>
          </div>

          {/* Ethernet Kablo */}
          <div className="bg-white border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-4 mb-3">
              <Cable className="w-8 h-8 text-cyan-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">Ethernet Kablo (İnternet)</h4>
                <p className="text-gray-700 mt-2">Bu kablo internet bağlantısı için kullanılır. Bir ucu modeme, diğer ucu PC kasasına takılır.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/pl0rvgqn_image.png" alt="Ethernet Kablo" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">Ethernet Kablo</p>
              </div>
              <div className="text-center">
                <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/8q4dm2eg_image.png" alt="Ethernet Girişi" className="w-full h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                <p className="text-sm text-gray-600 mt-2 font-semibold">Ethernet Girişi</p>
              </div>
            </div>
          </div>

        </div>
      )
    },
    {
      icon: Usb,
      title: t('pcSetup.step2.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step2.desc')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Badge className="bg-red-600 text-white text-lg px-3 py-1 flex-shrink-0">1</Badge>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-2">{t('pcSetup.step2.port1')}</span>
                  <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/4bye9ldu_image.png" alt="Güç Girişi" className="w-full h-24 object-contain rounded shadow-sm bg-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Badge className="bg-red-600 text-white text-lg px-3 py-1 flex-shrink-0">2</Badge>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-2">{t('pcSetup.step2.port2')}</span>
                  <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/4iongkwu_image.png" alt="HDMI Port" className="w-full h-24 object-contain rounded shadow-sm bg-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Badge className="bg-red-600 text-white text-lg px-3 py-1 flex-shrink-0">3</Badge>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-2">{t('pcSetup.step2.port3')}</span>
                  <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/oz6wiwdy_image.png" alt="VGA Port" className="w-full h-24 object-contain rounded shadow-sm bg-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Badge className="bg-red-600 text-white text-lg px-3 py-1 flex-shrink-0">4</Badge>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-2">{t('pcSetup.step2.port4')}</span>
                  <p className="text-sm text-gray-600 mb-2">USB Kulaklık, Mouse, Klavye ve Webcam buraya takılacaktır.</p>
                  <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/c1onkm4v_image.png" alt="USB Port" className="w-full h-24 object-contain rounded shadow-sm bg-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Badge className="bg-red-600 text-white text-lg px-3 py-1 flex-shrink-0">5</Badge>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block mb-2">{t('pcSetup.step2.port5')}</span>
                  <p className="text-sm text-gray-600 mb-2">{t('pcSetup.step2.note')}</p>
                  <img src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/8q4dm2eg_image.png" alt="Ethernet Girişi" className="w-full h-24 object-contain rounded shadow-sm bg-white" />
                </div>
              </div>
            </div>
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
          
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="bg-white border-l-4 border-red-600 p-4 rounded-lg shadow-sm">
                <div className="flex items-start space-x-3">
                  <Badge className="bg-red-600 text-white">{num}</Badge>
                  <p className="text-gray-700 flex-1">{t(`pcSetup.step3.connection${num}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: Monitor,
      title: t('pcSetup.step4.title'),
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step4.desc')}</p>
          
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Badge className="bg-blue-600 text-white text-lg px-3 py-1">VGA</Badge>
              <div className="flex-1">
                <p className="text-gray-700 mb-2">{t('pcSetup.step4.instruction1')}</p>
                <p className="text-gray-700">{t('pcSetup.step4.instruction2')}</p>
              </div>
            </div>
            
            <div className="border-t-2 border-gray-200 pt-4"></div>
            
            <div className="flex items-start space-x-4">
              <Badge className="bg-purple-600 text-white text-lg px-3 py-1">HDMI</Badge>
              <div className="flex-1">
                <p className="text-gray-700 mb-2">{t('pcSetup.step4.instruction3')}</p>
                <p className="text-gray-700">{t('pcSetup.step4.instruction4')}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800"><strong>💡 {t('pcSetup.step4.tip')}</strong></p>
          </div>
        </div>
      )
    },
    {
      icon: Monitor,
      title: t('pcSetup.step5.title'),
      content: (
        <div className="space-y-6">
          <p className="text-lg text-gray-700 font-semibold">{t('pcSetup.step5.desc')}</p>
          
          {/* PC Kasa Arka Panel Bağlantı Şeması */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border-2 border-red-500">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">PC Kasası Arka Panel Bağlantıları</h3>
            <div className="max-w-4xl mx-auto">
              <img 
                src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/xe9ammxl_image.png" 
                alt="PC Kasa Arka Panel Bağlantıları - Detaylı Şema" 
                className="w-full rounded-lg shadow-2xl border-4 border-gray-300"
              />
              <div className="mt-6 bg-white rounded-lg p-4 shadow-md">
                <h4 className="font-bold text-lg text-gray-900 mb-3">Bağlantı Rehberi:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>Güç Kablosu:</strong> Elektrik prizine bağlanır</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>HDMI Kablo:</strong> 2. Monitöre bağlanır</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>VGA Kablo:</strong> 1. Monitöre bağlanır</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>Ethernet Kablo:</strong> Modeme/İnternete bağlanır</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>USB (Klavye/Mouse):</strong> USB portlarına bağlanır</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                    <span className="text-gray-700"><strong>USB Kulaklık:</strong> ARKA panel USB portuna bağlanır</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Adım Adım Kurulum:</h3>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">1</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step5.instruction1')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">2</Badge>
              <p className="text-gray-700 flex-1">
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded text-sm">WIN</kbd> + 
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded text-sm ml-2">P</kbd>
                <br />
                {t('pcSetup.step5.instruction2')}
              </p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">3</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step5.instruction3')}</p>
            </div>
            <div className="flex items-start space-x-4">
              <Badge className="bg-red-600 text-white text-lg px-3 py-1">4</Badge>
              <p className="text-gray-700 flex-1">{t('pcSetup.step5.instruction4')}</p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800"><strong>💡 {t('pcSetup.step5.tip')}</strong></p>
          </div>
        </div>
      )
    }
  ];

  const StepIcon = steps[currentStep].icon;

  return (
    <PageShell theme="blue" icon={Monitor} title={t('pcSetup.title')} subtitle={t('pcSetup.subtitle')} maxWidth="max-w-5xl">
      {showCompletion && <CompletionScreen />}
          <Tabs defaultValue="interactive" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 glass-panel p-1">
              <TabsTrigger value="interactive" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">
                {t('pcSetup.interactive')}
              </TabsTrigger>
              <TabsTrigger value="scroll" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all">
                {t('pcSetup.scrollView')}
              </TabsTrigger>
            </TabsList>

            {/* Interactive Guide */}
            <TabsContent value="interactive">
              <Card className="glass-panel border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50/80 to-white/50 rounded-t-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                      <StepIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-2">Adım {currentStep + 1} / {steps.length}</Badge>
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
                      variant="brandOutline"
                      className="disabled:opacity-50"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      {t('pcSetup.previous')}
                    </Button>
                    {currentStep < steps.length - 1 ? (
                      <Button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        variant="brand"
                      >
                        {t('pcSetup.next')}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => setShowCompletion(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                      >
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
                  <span className="text-sm text-gray-600">İlerleme</span>
                  <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
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
                    <Card key={index} className="glass-panel border-0 hover:shadow-xl transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-blue-50/60 to-white/50 rounded-t-2xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-2">Adım {index + 1}</Badge>
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
    </PageShell>
  );
};

export default PCSetup;
