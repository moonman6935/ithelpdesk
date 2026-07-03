import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { CheckCircle, AlertCircle, Package, User, Lock, FileText } from 'lucide-react';
import api from '../lib/api';
import PageShell from '../components/PageShell';
import { translations } from '../translations/translations';

const AssetConfirmation = () => {
    const { language, t } = useLanguage();
    const [step, setStep] = useState(1);
    const [personnelName, setPersonnelName] = useState('');
    const [personnelId, setPersonnelId] = useState('');
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [isAccepted, setIsAccepted] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [formTermsAccepted, setFormTermsAccepted] = useState(false);

    const resetFlow = () => {
        setStep(1);
        setPersonnelName('');
        setPersonnelId('');
        setAssets([]);
        setError('');
        setConfirmed(false);
        setIsAccepted(false);
        setFormDialogOpen(false);
        setFormTermsAccepted(false);
    };

    const checkName = async () => {
        const name = personnelName.trim();
        if (name.length < 3) {
            setError(t('assetConfirmation.enterFullName'));
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
                setError(t('assetConfirmation.nameNotFound'));
            }
        } catch {
            setError(t('assetConfirmation.error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        if (personnelId.length !== 6) {
            setError(t('assetConfirmation.enterPersonnelNo'));
            return;
        }

        setLoading(true);
        setError('');
        setConfirmed(false);
        setAssets([]);

        try {
            const response = await api.post('/api/inventory/lookup', {
                personnel_name: personnelName.trim(),
                personnel_id: personnelId,
            });

            if (!response.data.verified) {
                setError(t('assetConfirmation.verifyFailed'));
                return;
            }

            if (!response.data.items?.length) {
                setError(t('assetConfirmation.noAssets'));
            } else if (response.data.is_confirmed) {
                setConfirmed(true);
                setAssets(response.data.items);
            } else {
                setAssets(response.data.items);
            }
        } catch {
            setError(t('assetConfirmation.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (checked) => {
        if (checked) {
            setFormTermsAccepted(false);
            setFormDialogOpen(true);
        } else {
            setIsAccepted(false);
            setFormTermsAccepted(false);
        }
    };

    const handleFormAccept = () => {
        if (!formTermsAccepted) return;
        setIsAccepted(true);
        setFormDialogOpen(false);
    };

    const clauses =
        translations[language]?.assetConfirmation?.formClauses
        || translations.tr.assetConfirmation.formClauses
        || [];

    const handleConfirm = async () => {
        try {
            await api.post('/api/inventory/confirm', {
                personnel_id: personnelId,
                personnel_name: personnelName.trim(),
                items: assets,
            });
            setSuccess(true);
        } catch {
            setError(t('assetConfirmation.confirmError'));
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
        <PageShell theme="rose" icon={Package} title={t('assetConfirmation.title')} subtitle={t('assetConfirmation.subtitle')}>
                <Card className="glass-panel border-0 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-rose-50/80 to-white/50 rounded-t-2xl">
                        <CardTitle className="text-3xl">{t('assetConfirmation.title')}</CardTitle>
                        <CardDescription>
                            {step === 1 ? t('assetConfirmation.step1Description') : t('assetConfirmation.step2Description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {step === 1 ? (
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <Input
                                    placeholder={t('assetConfirmation.namePlaceholder')}
                                    value={personnelName}
                                    onChange={(e) => setPersonnelName(e.target.value)}
                                    className="text-lg py-6"
                                    autoComplete="name"
                                />
                                <Button onClick={checkName} disabled={loading} variant="brand" className="px-8 py-6 h-auto shrink-0">
                                    {loading ? '...' : t('assetConfirmation.continue')}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-rose-50 rounded-lg px-4 py-3">
                                    <User className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>{personnelName}</span>
                                    <button
                                        type="button"
                                        onClick={resetFlow}
                                        className="ml-auto text-red-600 text-xs font-medium hover:underline"
                                    >
                                        {t('assetConfirmation.changeName')}
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type="password"
                                            name="asset-personnel-verify"
                                            placeholder={t('assetConfirmation.personnelCodePlaceholder')}
                                            value={personnelId}
                                            onChange={(e) => setPersonnelId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            maxLength={6}
                                            inputMode="numeric"
                                            autoComplete="new-password"
                                            className="text-lg py-6 pl-10 tracking-widest"
                                        />
                                    </div>
                                    <Button onClick={fetchAssets} disabled={loading} variant="brand" className="px-8 py-6 h-auto shrink-0">
                                        {loading ? '...' : t('assetConfirmation.checkAssets')}
                                    </Button>
                                </div>
                            </div>
                        )}

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
                                        <div
                                            className="flex items-center space-x-2 bg-red-50 p-4 rounded-lg border border-red-100 cursor-pointer"
                                            onClick={() => !isAccepted && handleCheckboxChange(true)}
                                            onKeyDown={(e) => e.key === 'Enter' && !isAccepted && handleCheckboxChange(true)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <Checkbox
                                                id="confirm"
                                                checked={isAccepted}
                                                onCheckedChange={handleCheckboxChange}
                                            />
                                            <label htmlFor="confirm" className="text-sm font-medium leading-snug cursor-pointer text-red-900">
                                                {t('assetConfirmation.confirmCheckbox')}
                                            </label>
                                        </div>

                                        {isAccepted && (
                                            <p className="text-xs text-green-700 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" />
                                                {t('assetConfirmation.formSigned')}
                                            </p>
                                        )}

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

                <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <FileText className="w-5 h-5 text-red-600" />
                                {t('assetConfirmation.formTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('assetConfirmation.formIntro')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 text-sm text-gray-700">
                            <div className="rounded-lg border bg-gray-50 p-4 space-y-1">
                                <p className="font-semibold text-gray-900">{personnelName}</p>
                                <p className="text-gray-500 font-mono text-xs">{personnelId}</p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900 mb-2">{t('assetConfirmation.formAssetsList')}</p>
                                <ul className="space-y-2 border rounded-lg divide-y">
                                    {assets.map((item, idx) => (
                                        <li key={idx} className="flex justify-between gap-2 p-3 text-sm">
                                            <span className="font-medium">{item.item_name}</span>
                                            <span className="text-gray-500 font-mono shrink-0">S/N: {item.serial_number}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-900 mb-3">{t('assetConfirmation.formTermsTitle')}</p>
                                <ol className="list-decimal list-inside space-y-3 leading-relaxed">
                                    {clauses.map((clause, idx) => (
                                        <li key={idx} className="pl-1">{clause}</li>
                                    ))}
                                </ol>
                            </div>

                            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                                <Checkbox
                                    id="form-terms"
                                    checked={formTermsAccepted}
                                    onCheckedChange={setFormTermsAccepted}
                                    className="mt-0.5"
                                />
                                <label htmlFor="form-terms" className="text-sm font-medium text-red-900 leading-snug cursor-pointer">
                                    {t('assetConfirmation.formTermsCheckbox')}
                                </label>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormDialogOpen(false)}
                            >
                                {t('assetConfirmation.formCancel')}
                            </Button>
                            <Button
                                type="button"
                                variant="brand"
                                disabled={!formTermsAccepted}
                                onClick={handleFormAccept}
                            >
                                {t('assetConfirmation.formAccept')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
        </PageShell>
    );
};

export default AssetConfirmation;
