import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Truck, AlertCircle, Package, MapPin, Calendar, User, ExternalLink, History } from 'lucide-react';
import api from '../lib/api';

const STATUS_STYLES = {
  in_transit: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  returned: 'bg-blue-100 text-blue-800 border-blue-200',
};

const CargoStatus = () => {
  const { t } = useLanguage();
  const [personnelId, setPersonnelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fetchStatus = async () => {
    if (personnelId.length !== 6) {
      setError(t('cargoTracking.enterPersonnelNo'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.get(`/api/cargo/status/${personnelId}`);
      setResult(response.data);
      if (!response.data.personnel_name) {
        setError(t('cargoTracking.notFound'));
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
          <CardDescription>{t('cargoTracking.enterPersonnelNo')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="123456"
              value={personnelId}
              onChange={(e) => setPersonnelId(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              className="text-lg py-6"
            />
            <Button onClick={fetchStatus} disabled={loading} variant="brand" className="px-8 py-6 h-auto shrink-0">
              {loading ? '...' : t('cargoTracking.checkStatus')}
            </Button>
          </div>

          <p className="text-sm text-gray-500">
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

          {result.shipments.map((shipment) => (
            <Card key={shipment.id} className="glass-panel border-0 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{shipment.item_name}</CardTitle>
                      <CardDescription className="font-mono">
                        {shipment.yurtici?.doc_id
                          ? `${t('cargoTracking.trackingNo')}: ${shipment.yurtici.doc_id}`
                          : `S/N: ${shipment.serial_number}`}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`border ${STATUS_STYLES[shipment.status] || STATUS_STYLES.in_transit}`}>
                    {shipment.yurtici?.status_label || t(`cargoTracking.status.${shipment.status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 pt-0">
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
                {shipment.yurtici?.tracking_url && (
                  <p className="flex items-center gap-2 sm:col-span-2">
                    <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                      href={shipment.yurtici.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 font-medium hover:underline"
                    >
                      {t('cargoTracking.viewOnYurtici')}
                    </a>
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
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default CargoStatus;
