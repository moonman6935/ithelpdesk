import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Search, X, Upload, Eye, Truck, PackageCheck, RefreshCcw } from 'lucide-react';
import { readExcelFile } from '../lib/excelImport';
import { batchImport, getImportErrorMessage } from '../lib/batchImport';
import api from '../lib/api';

const CargoPanel = ({ direction, canWrite }) => {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [importPreview, setImportPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [selected, setSelected] = useState(null);
    const fileInputRef = useRef(null);

    const isOutgoing = direction === 'outgoing';
    const titleKey = isOutgoing ? 'admin.outgoingCargo' : 'admin.incomingCargo';
    const descKey = isOutgoing ? 'admin.outgoingCargoDesc' : 'admin.incomingCargoDesc';

    const fetchCargo = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/cargo/${direction}`);
            setItems(res.data);
        } catch (err) {
            console.error('Kargo verisi alınamadı', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [direction]);

    const handleSyncFromInventory = async () => {
        if (!window.confirm(t('admin.cargoSyncConfirm'))) return;
        setLoading(true);
        try {
            const res = await api.post('/api/admin/cargo/sync-from-inventory', { direction });
            alert(`${res.data.imported} ${t('admin.cargoSyncDone')}${res.data.skipped ? `, ${res.data.skipped} ${t('admin.importSkipped')}` : ''}`);
            fetchCargo();
        } catch (err) {
            alert(err.response?.data?.detail || t('admin.cargoSyncError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCargo();
    }, [fetchCargo]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) =>
            (item.personnel_name || '').toLowerCase().includes(q) ||
            (item.serial_number || '').toLowerCase().includes(q) ||
            (item.item_name || '').toLowerCase().includes(q)
        );
    }, [items, search]);

    const handleExcelFileSelect = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const result = await readExcelFile(file);
            if (!result.items.length) {
                alert(t('admin.importNoRows'));
                return;
            }
            setImportPreview({ ...result, fileName: file.name, direction });
        } catch (err) {
            alert(t('admin.importError'));
            console.error(err);
        }
    };

    const handleConfirmImport = async () => {
        if (!importPreview?.items?.length) return;
        setImporting(true);
        try {
            const { imported, skipped } = await batchImport(
                '/api/admin/cargo/import',
                { direction: importPreview.direction },
                importPreview.items
            );
            alert(`${imported} ${t('admin.importSuccess')}${skipped ? `, ${skipped} ${t('admin.importSkipped')}` : ''}`);
            setImportPreview(null);
            fetchCargo();
        } catch (err) {
            alert(getImportErrorMessage(err, t('admin.importError')));
        } finally {
            setImporting(false);
        }
    };

    const renderDetailBlock = (record, type) => {
        if (!record) {
            return (
                <p className="text-sm text-gray-400 italic">
                    {type === 'out' ? t('admin.cargoNoOutgoing') : t('admin.cargoNoIncoming')}
                </p>
            );
        }
        const isOut = type === 'out';
        return (
            <div className="space-y-2 text-sm border rounded-lg p-4 bg-gray-50">
                <h4 className="font-bold text-base flex items-center gap-2">
                    {isOut ? <Truck className="w-4 h-4 text-orange-600" /> : <PackageCheck className="w-4 h-4 text-green-600" />}
                    {isOut ? t('admin.cargoOutgoingRecord') : t('admin.cargoIncomingRecord')}
                </h4>
                <p><span className="text-gray-500">{t('admin.personnelName')}:</span> {record.personnel_name}</p>
                <p><span className="text-gray-500">{t('admin.itemName')}:</span> {record.item_name}</p>
                <p><span className="text-gray-500">S/N:</span> <span className="font-mono">{record.serial_number}</span></p>
                <p><span className="text-gray-500">{t('admin.date')}:</span> {new Date(record.created_at).toLocaleString()}</p>
                {record.address && <p><span className="text-gray-500">{t('admin.cargoAddress')}:</span> {record.address}</p>}
                {record.phone && <p><span className="text-gray-500">{t('admin.cargoPhone')}:</span> {record.phone}</p>}
                {record.delivery_type && <p><span className="text-gray-500">{t('admin.cargoDeliveryType')}:</span> {record.delivery_type}</p>}
                {record.recipient && <p><span className="text-gray-500">{t('admin.cargoRecipient')}:</span> {record.recipient}</p>}
                {record.return_flag && <p><span className="text-gray-500">{t('admin.cargoReturnFlag')}:</span> {record.return_flag}</p>}
                {record.return_reason && <p><span className="text-gray-500">{t('admin.cargoReturnReason')}:</span> {record.return_reason}</p>}
            </div>
        );
    };

    return (
        <>
            <Card className="border-2">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle>{t(titleKey)}</CardTitle>
                            <CardDescription>{t(descKey)}</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                            {canWrite && (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                                        onClick={handleSyncFromInventory}
                                        disabled={loading}
                                    >
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        {t('admin.cargoSyncFromInventory')}
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        onChange={handleExcelFileSelect}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {t('admin.importExcel')}
                                    </Button>
                                </>
                            )}
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('admin.searchByName')}
                                    className="pl-9 pr-9 rounded-xl border-gray-200"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        aria-label={t('admin.clearSearch')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center text-gray-500 py-8">...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-left">
                                        <th className="p-4">{t('admin.personnelName')}</th>
                                        <th className="p-4">{t('admin.itemName')}</th>
                                        <th className="p-4 font-normal text-gray-500">S/N</th>
                                        <th className="p-4">{t('admin.status')}</th>
                                        <th className="p-4">{t('admin.date')}</th>
                                        <th className="p-4">{t('admin.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                                {search.trim() ? t('admin.noSearchResults') : t('admin.noRecords')}
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((item) => (
                                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                                <td className="p-4 font-medium">{item.personnel_name}</td>
                                                <td className="p-4">{item.item_name}</td>
                                                <td className="p-4 text-gray-500 font-mono">{item.serial_number}</td>
                                                <td className="p-4">
                                                    {item.is_returned ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                            {t('admin.cargoReturned')}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className={isOutgoing ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}>
                                                            {isOutgoing ? t('admin.cargoShipped') : t('admin.cargoReceived')}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs text-gray-500">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </td>
                                                <td className="p-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600"
                                                        onClick={() => setSelected(item)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        {t('admin.cargoInspect')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={Boolean(importPreview)} onOpenChange={(open) => !open && setImportPreview(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('admin.importPreview')}</DialogTitle>
                        <DialogDescription>
                            {importPreview?.fileName} — {importPreview?.items?.length} {t('admin.importRowsFound')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    <th className="p-2">{t('admin.personnelName')}</th>
                                    <th className="p-2">{t('admin.itemName')}</th>
                                    <th className="p-2">S/N</th>
                                    <th className="p-2">{t('admin.date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importPreview?.items?.slice(0, 10).map((item, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="p-2">{item.personnel_name}</td>
                                        <td className="p-2">{item.item_name}</td>
                                        <td className="p-2 font-mono">{item.serial_number}</td>
                                        <td className="p-2">{new Date(item.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportPreview(null)} disabled={importing}>
                            {t('admin.importCancel')}
                        </Button>
                        <Button onClick={handleConfirmImport} disabled={importing} className="bg-orange-600 hover:bg-orange-700">
                            <Upload className="w-4 h-4 mr-2" />
                            {importing ? '...' : `${t('admin.importConfirm')} (${importPreview?.items?.length ?? 0})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('admin.cargoDetails')}</DialogTitle>
                        <DialogDescription>
                            {selected?.personnel_name} — {selected?.serial_number}
                        </DialogDescription>
                    </DialogHeader>
                    {selected?.is_returned && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-green-800 text-sm font-medium">
                            {t('admin.cargoReturnMatched')}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isOutgoing
                            ? renderDetailBlock(selected, 'out')
                            : renderDetailBlock(selected?.match || selected, 'out')}
                        {isOutgoing
                            ? renderDetailBlock(selected?.match, 'in')
                            : renderDetailBlock(selected, 'in')}
                    </div>
                    {!selected?.match && !selected?.is_returned && (
                        <p className="text-sm text-gray-500">{t('admin.cargoNoMatch')}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>
                            {t('admin.importCancel')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CargoPanel;
