import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Truck, AlertCircle, Package, MapPin, Calendar, User, ExternalLink, History, Lock } from 'lucide-react';
import api from '../lib/api';
import { buildYurticiTrackingUrl, getShipmentTrackingNumber } from '../lib/yurticiTracking';

const STATUS_STYLES = {
  in_transit: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  returned: 'bg-blue-100 text-blue-800 border-blue-200',
};

const CargoStatus = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [personnelName, setPersonnelName] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const resetFlow = () => {
    setStep(1);
    setPersonnelName('');
    setPersonnelId('');
    setError('');
    setResult(null);
  };

  const checkName = async () => {
    const name = personnelName.trim();
    if (name.length < 3) {
      setError(t('cargoTracking.enterFullName'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/cargo/check-name', { personnel_name: name });
      if (response.data.found) {
        setPersonnelId('');
        setStep(2);
      } else {
        setError(t('cargoTracking.nameNotFound'));
      }
    } catch {
      setError(t('cargoTracking.error'));
    } finally {
      setLoading(false);
    }
  };

  const verifyAndFetch = async () => {
    if (personnelId.length !== 6) {
      setError(t('cargoTracking.enterPersonnelNo'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/api/cargo/status', {
        personnel_name: personnelName.trim(),
        personnel_id: personnelId,
      });
      setResult(response.data);

      if (!response.data.verified || !response.data.personnel_name) {
        setError(t('cargoTracking.verifyFailed'));
      } else if (!response.data.shipments?.length) {
        setError(t('cargoTracking.noShipments'));
      }
    } catch {
      setError(t('cargoTracking.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      theme="orange"
      icon={Truck}
      title={t('cargoTracking.title')}
      subtitle={t('cargoTracking.subtitle')}
    >
      <Card className="glass-panel border-0 shadow-xl mb-6">
        <CardHeader className="bg-gradient-to-r from-orange-50/80 to-white/50 rounded-t-2xl">
          <CardTitle className="text-2xl">{t('cargoTracking.lookupTitle')}</CardTitle>
          <CardDescription>
            {step === 1 ? t('cargoTracking.step1Description') : t('cargoTracking.step2Description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder={t('cargoTracking.namePlaceholder')}
                  value={personnelName}
                  onChange={(e) => setPersonnelName(e.target.value)}
                  className="text-lg py-6"
                  autoComplete="name"
                />
                <Button onClick={checkName} disabled={loading} variant="brand" className="px-8 py-6 h-auto shrink-0">
                  {loading ? '...' : t('cargoTracking.continue')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 rounded-lg px-4 py-3">
                <User className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{personnelName}</span>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="ml-auto text-red-600 text-xs font-medium hover:underline"
                >
                  {t('cargoTracking.changeName')}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    name="cargo-personnel-verify"
                    placeholder={t('cargoTracking.personnelCodePlaceholder')}
                    value={personnelId}
                    onChange={(e) => setPersonnelId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="text-lg py-6 pl-10 tracking-widest"
                  />
                </div>
                <Button onClick={verifyAndFetch} disabled={loading} variant="brand" className="px-8 py-6 h-auto shrink-0">
                  {loading ? '...' : t('cargoTracking.checkStatus')}
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-4">
            {t('cargoTracking.hint')}{' '}
            <Link to="/asset-confirmation" className="text-red-600 font-medium hover:underline">
              {t('assetConfirmation.title')}
            </Link>
          </p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result?.personnel_name && result.shipments?.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-gray-700">
            <User className="w-5 h-5 text-orange-600" />
            <span className="font-semibold">{result.personnel_name}</span>
            <span className="text-gray-400">•</span>
            <span className="font-mono text-sm">{result.personnel_id}</span>
          </div>

          {result.shipments.map((shipment) => {
            const trackingNo = getShipmentTrackingNumber(shipment);
            const trackingUrl = buildYurticiTrackingUrl(trackingNo, shipment.yurtici?.tracking_url);

            return (
            <Card key={shipment.id} className="glass-panel border-0 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{shipment.item_name}</CardTitle>
                    </div>
                  </div>
                  <Badge className={`border ${STATUS_STYLES[shipment.status] || STATUS_STYLES.in_transit}`}>
                    {shipment.yurtici?.status_label || t(`cargoTracking.status.${shipment.status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 pt-0">
                {trackingNo && (
                  <div className="sm:col-span-2 rounded-xl border border-orange-200 bg-orange-50/70 p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {t('cargoTracking.trackingNo')}
                    </p>
                    <p className="font-mono text-xl font-bold text-gray-900 mb-3">{trackingNo}</p>
                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        {t('cargoTracking.trackOnYurtici')}
                      </a>
                    )}
                  </div>
                )}
                {shipment.ship_date && (
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{t('cargoTracking.shipDate')}: {shipment.ship_date}</span>
                  </p>
                )}
                {shipment.delivery_date && (
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{t('cargoTracking.deliveryDate')}: {shipment.delivery_date}{shipment.delivery_time ? ` ${shipment.delivery_time}` : ''}</span>
                  </p>
                )}
                {shipment.recipient && (
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{t('cargoTracking.recipient')}: {shipment.recipient}</span>
                  </p>
                )}
                {shipment.address && (
                  <p className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span>{shipment.address}{shipment.arrival_city ? `, ${shipment.arrival_city}` : ''}</span>
                  </p>
                )}
                {shipment.yurtici?.events?.length > 0 && (
                  <div className="sm:col-span-2 mt-2 pt-3 border-t border-gray-100">
                    <p className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                      <History className="w-4 h-4 text-orange-600" />
                      {t('cargoTracking.movementHistory')}
                    </p>
                    <ul className="space-y-2">
                      {shipment.yurtici.events.slice(0, 8).map((event, idx) => (
                        <li key={`${event.datetime}-${idx}`} className="text-sm text-gray-600 pl-4 border-l-2 border-orange-200">
                          {event.datetime && <span className="block text-xs text-gray-400">{event.datetime}</span>}
                          <span className="font-medium text-gray-800">{event.description}</span>
                          {event.location && <span className="block text-xs text-gray-500">{event.location}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default CargoStatus;
