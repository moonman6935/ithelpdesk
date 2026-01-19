import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Headphones, Mic, Volume2, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeadsetTest = () => {
  const { t } = useLanguage();
  const [micPermission, setMicPermission] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [micTested, setMicTested] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const oscillatorRef = useRef(null);

  useEffect(() => {
    // Check if microphone permission is already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' }).then((result) => {
        setMicPermission(result.state === 'granted');
      });
    }

    return () => {
      stopMicTest();
      stopTestSound();
    };
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermission(false);
    }
  };

  const playTestSound = () => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create oscillator for test tone (440Hz - A note)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillatorRef.current = { oscillator, audioContext };
      
      setIsPlayingSound(true);
      setSpeakerTested(true);
    } catch (error) {
      console.error('Error playing test sound:', error);
    }
  };

  const stopTestSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.oscillator.stop();
        oscillatorRef.current.audioContext.close();
        oscillatorRef.current = null;
      } catch (error) {
        console.error('Error stopping test sound:', error);
      }
    }
    setIsPlayingSound(false);
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      setIsTesting(true);
      setMicTested(true);
      analyzeMicLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicPermission(false);
    }
  };

  const analyzeMicLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const checkLevel = () => {
      if (!analyserRef.current || !isTesting) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      
      setMicLevel(normalizedLevel);
      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  };

  const stopMicTest = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsTesting(false);
    setMicLevel(0);
  };

  const getTestStatus = (tested, isWorking) => {
    if (!tested) {
      return {
        icon: AlertCircle,
        text: t('headsetTest.results.notTested'),
        color: 'text-gray-500',
        bgColor: 'bg-gray-100'
      };
    }
    if (isWorking) {
      return {
        icon: CheckCircle,
        text: t('headsetTest.results.working'),
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    }
    return {
      icon: XCircle,
      text: t('headsetTest.results.notWorking'),
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    };
  };

  const speakerStatus = getTestStatus(speakerTested, speakerTested);
  const micStatus = getTestStatus(micTested, micTested && micLevel > 5);
  const SpeakerIcon = speakerStatus.icon;
  const MicIcon = micStatus.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <Headphones className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('headsetTest.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('headsetTest.subtitle')}
            </p>
          </div>

          {/* Microphone Permission */}
          {micPermission === false && (
            <Alert className="mb-8 border-2 border-red-500 bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <AlertDescription className="ml-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-800">{t('headsetTest.permission')}</p>
                    <p className="text-red-700">{t('headsetTest.permissionDesc')}</p>
                  </div>
                  <Button onClick={requestMicPermission} className="bg-red-600 hover:bg-red-700 ml-4">
                    {t('headsetTest.requestPermission')}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Speaker Test */}
          <Card className="mb-8 border-2 border-gray-200 hover:border-red-500 transition-colors">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{t('headsetTest.speakerTest')}</CardTitle>
                  <CardDescription className="text-base">{t('headsetTest.speakerDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {!isPlayingSound ? (
                  <Button 
                    onClick={playTestSound}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                    size="lg"
                  >
                    <Volume2 className="mr-2 w-5 h-5" />
                    {t('headsetTest.playSound')}
                  </Button>
                ) : (
                  <Button 
                    onClick={stopTestSound}
                    variant="outline"
                    className="border-2 border-red-600 text-red-600 hover:bg-red-50 flex-1"
                    size="lg"
                  >
                    {t('headsetTest.stopSound')}
                  </Button>
                )}
              </div>
              {speakerTested && (
                <div className={`mt-4 p-4 rounded-lg ${speakerStatus.bgColor} flex items-center space-x-3`}>
                  <SpeakerIcon className={`w-6 h-6 ${speakerStatus.color}`} />
                  <span className={`font-semibold ${speakerStatus.color}`}>
                    {t('headsetTest.results.speaker')}: {speakerStatus.text}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Microphone Test */}
          <Card className="mb-8 border-2 border-gray-200 hover:border-red-500 transition-colors">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{t('headsetTest.micTest')}</CardTitle>
                  <CardDescription className="text-base">{t('headsetTest.micDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {!isTesting ? (
                  <Button 
                    onClick={startMicTest}
                    disabled={micPermission === false}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                    size="lg"
                  >
                    <Mic className="mr-2 w-5 h-5" />
                    {t('headsetTest.startTest')}
                  </Button>
                ) : (
                  <Button 
                    onClick={stopMicTest}
                    variant="outline"
                    className="border-2 border-red-600 text-red-600 hover:bg-red-50 flex-1"
                    size="lg"
                  >
                    {t('headsetTest.stopTest')}
                  </Button>
                )}
              </div>

              {isTesting && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Microphone Level</span>
                      <Badge className={micLevel > 5 ? 'bg-green-600' : 'bg-gray-400'}>
                        {Math.round(micLevel)}%
                      </Badge>
                    </div>
                    <Progress value={micLevel} className="h-4" />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-16 rounded transition-all duration-100 ${
                          micLevel > (i * 20) ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                        style={{
                          height: `${40 + (i * 10)}px`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {micTested && (
                <div className={`mt-4 p-4 rounded-lg ${micStatus.bgColor} flex items-center space-x-3`}>
                  <MicIcon className={`w-6 h-6 ${micStatus.color}`} />
                  <span className={`font-semibold ${micStatus.color}`}>
                    {t('headsetTest.results.microphone')}: {micStatus.text}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Summary */}
          {(speakerTested || micTested) && (
            <Card className="border-2 border-red-500">
              <CardHeader className="bg-gradient-to-r from-red-50 to-white">
                <CardTitle className="text-2xl">{t('headsetTest.results.title')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-6 h-6 text-gray-600" />
                      <span className="font-semibold text-gray-700">{t('headsetTest.results.speaker')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${speakerStatus.color}`}>
                      <SpeakerIcon className="w-5 h-5" />
                      <span className="font-semibold">{speakerStatus.text}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mic className="w-6 h-6 text-gray-600" />
                      <span className="font-semibold text-gray-700">{t('headsetTest.results.microphone')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${micStatus.color}`}>
                      <MicIcon className="w-5 h-5" />
                      <span className="font-semibold">{micStatus.text}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-blue-800">
                    {t('headsetTest.troubleshoot')}
                  </p>
                  <Link to="/troubleshooting">
                    <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 mt-2">
                      {t('header.troubleshooting')} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeadsetTest;
