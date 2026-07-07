import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { HelpCircle, Mic, ListChecks, Headphones, Settings, Globe, Monitor, Chrome, AlertTriangle, Download, ArrowRight } from 'lucide-react';

const faqItems = [
  { id: 'citrixInstall', icon: Download, isGuide: true },
  { id: 'q1', icon: Mic },
  { id: 'q2', icon: ListChecks },
  { id: 'q3', icon: Headphones, images: ['win10-speaker.png', 'win11-speaker.png'], imageLabels: ['win10', 'win11'] },
  { id: 'q4', icon: Settings, images: ['citrix-settings.png'] },
  { id: 'q5', icon: Globe, images: ['browser-permission.png'] },
  { id: 'q6', icon: Monitor, images: ['edge-permission.png'] },
  { id: 'q7', icon: Chrome, images: ['chrome-step1.png', 'chrome-step2.png', 'chrome-step3.png'], hasSteps: true },
  { id: 'q8', icon: AlertTriangle, images: ['customer-message.png'] },
];

const FAQ = () => {
  const { t } = useLanguage();

  const renderAnswer = (item) => {
    const paragraphs = [];
    let i = 1;
    while (t(`faq.${item.id}.answer${i}`) !== `faq.${item.id}.answer${i}`) {
      paragraphs.push(t(`faq.${item.id}.answer${i}`));
      i++;
    }
    if (paragraphs.length === 0 && t(`faq.${item.id}.answer`) !== `faq.${item.id}.answer`) {
      paragraphs.push(t(`faq.${item.id}.answer`));
    }

    return (
      <div className="space-y-4">
        {paragraphs.map((text, idx) => (
          <p key={idx} className="text-gray-700 leading-relaxed">{text}</p>
        ))}

        {item.isGuide && (
          <Link to="/faq/citrix-kurulum">
            <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700">
              {t('faq.citrixInstall.openGuide')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}

        {item.hasSteps && (
          <div className="space-y-6 mt-4">
            {item.images.map((img, idx) => (
              <div key={img} className="bg-white p-4 rounded-lg border-2 border-red-100">
                <div className="flex items-start space-x-3 mb-3">
                  <Badge className="bg-red-600 text-white">{idx + 1}</Badge>
                  <p className="text-gray-700 font-medium">{t(`faq.${item.id}.step${idx + 1}`)}</p>
                </div>
                <img
                  src={`${process.env.PUBLIC_URL}/faq/${img}`}
                  alt={t(`faq.${item.id}.step${idx + 1}`)}
                  className="max-w-full rounded-lg border border-gray-200 shadow-sm"
                />
              </div>
            ))}
          </div>
        )}

        {item.images && !item.hasSteps && (
          <div className={`grid gap-4 mt-4 ${item.images.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {item.images.map((img, idx) => (
              <div key={img} className="bg-white p-3 rounded-lg border border-gray-200">
                {item.imageLabels && (
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {t(`faq.${item.id}.${item.imageLabels[idx]}`)}
                  </p>
                )}
                <img
                  src={`${process.env.PUBLIC_URL}/faq/${img}`}
                  alt={t(`faq.${item.id}.question`)}
                  className="max-w-full rounded-lg"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageShell theme="violet" icon={HelpCircle} title={t('faq.title')} subtitle={t('faq.subtitle')}>
          <Alert className="mb-8 border-2 border-amber-300/80 bg-amber-50/90 backdrop-blur-sm glass-panel">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <AlertDescription className="ml-2 text-amber-900">
              <p className="font-semibold mb-1">{t('faq.introTitle')}</p>
              <p>{t('faq.introText')}</p>
            </AlertDescription>
          </Alert>

          <Card className="mb-8 border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-cyan-50 shadow-md overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0">
                <Download className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{t('faq.citrixInstall.featuredTitle')}</h3>
                <p className="text-gray-600 text-sm">{t('faq.citrixInstall.featuredDesc')}</p>
              </div>
              <Link to="/faq/citrix-kurulum" className="shrink-0">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  {t('faq.citrixInstall.openGuide')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0">
            <CardHeader className="bg-gradient-to-r from-violet-50/80 to-white/50 rounded-t-2xl">
              <CardTitle className="text-2xl">{t('faq.title')}</CardTitle>
              <CardDescription className="text-base">{t('faq.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="accordion-color-hover border-2 border-gray-200/80 rounded-xl mb-4 px-4 bg-white/60"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-violet-600" />
                          </div>
                          <span className="text-lg font-semibold">{t(`faq.${item.id}.question`)}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-2">
                        {renderAnswer(item)}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
    </PageShell>
  );
};

export default FAQ;
