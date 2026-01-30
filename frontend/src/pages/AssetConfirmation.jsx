import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, AlertCircle, Package } from 'lucide-react';
import api from '../lib/api';

const AssetConfirmation = () => {
    const { t } = useLanguage();
    const [personnelId, setPersonnelId] = useState('');
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [isAccepted, setIsAccepted] = useState(false);
    const [success, setSuccess] = useState(false);

    const fetchAssets = async () => {
        if (personnelId.length !== 6) {
            setError(t('assetConfirmation.enterPersonnelNo'));
            return;
        }
        setLoading(true);
        setError('');
        setConfirmed(false);
        try {
            const response = await api.get(`/api/inventory/${personnelId}`);
            if (response.data.items.length === 0) {
                setError(t('assetConfirmation.noAssets'));
            } else if (response.data.is_confirmed) {
                setConfirmed(true);
                setAssets(response.data.items);
            } else {
                setAssets(response.data.items);
            }
        } catch (err) {
            setError('Hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            await api.post('/api/inventory/confirm', {
                personnel_id: personnelId,
                personnel_name: assets[0]?.personnel_name || 'Bilinmiyor',
                items: assets,
                status: 'confirmed'
            });
            setSuccess(true);
        } catch (err) {
            setError('Onay gönderilirken hata oluştu.');
        }
    };

    if (success) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-4">{t('assetConfirmation.success')}</h1>
                <Button onClick={() => window.location.href = '/'} className="bg-red-600">Ana Sayfa</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <Card className="border-2 border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-white">
                        <CardTitle className="text-3xl">{t('assetConfirmation.title')}</CardTitle>
                        <CardDescription>{t('assetConfirmation.enterPersonnelNo')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex gap-4 mb-8">
                            <Input
                                placeholder="Örn: 123456"
                                value={personnelId}
                                onChange={(e) => setPersonnelId(e.target.value)}
                                maxLength={6}
                                className="text-lg py-6"
                            />
                            <Button onClick={fetchAssets} loading={loading} className="bg-red-600 px-8 py-6 h-auto">
                                {t('assetConfirmation.checkAssets')}
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {assets.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h3 className="text-xl font-bold">{t('assetConfirmation.itemsTitle')}</h3>
                                    {confirmed && (
                                        <Badge className="bg-green-600 text-white">ONAYLANDI</Badge>
                                    )}
                                </div>

                                {confirmed && (
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <CheckCircle className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800 font-medium">
                                            {t('assetConfirmation.alreadyConfirmed')}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid gap-4">
                                    {assets.map((item, idx) => (
                                        <div key={idx} className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm ${confirmed ? 'opacity-75' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <Package className="text-red-600" />
                                                <div>
                                                    <p className="font-bold">{item.item_name}</p>
                                                    <p className="text-sm text-gray-500">S/N: {item.serial_number}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!confirmed && (
                                    <>
                                        <div className="flex items-center space-x-2 bg-red-50 p-4 rounded-lg border border-red-100">
                                            <Checkbox
                                                id="confirm"
                                                checked={isAccepted}
                                                onCheckedChange={setIsAccepted}
                                            />
                                            <label htmlFor="confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-900">
                                                {t('assetConfirmation.confirmCheckbox')}
                                            </label>
                                        </div>

                                        <Button
                                            disabled={!isAccepted}
                                            onClick={handleConfirm}
                                            className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
                                        >
                                            {t('assetConfirmation.confirmButton')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AssetConfirmation;
