import React, { useMemo, useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import {
    Search, X, Upload, ChevronRight, Package, Truck, CheckCircle2, AlertCircle, ArrowLeftRight,
} from 'lucide-react';
import api from '../lib/api';

const CONDITION_OPTIONS = ['undamaged', 'damaged'];

const PersonnelInventoryPanel = ({
    inventory,
    statusFilter,
    onStatusFilterChange,
    canWrite,
    onImportClick,
    fileInputRef,
    onExcelSelect,
    onRefresh,
    onReturnAsset,
}) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [savingItemId, setSavingItemId] = useState(null);
    const [itemEdits, setItemEdits] = useState({});

    const personnelGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        const map = new Map();

        inventory.forEach((item) => {
            if (statusFilter === 'assigned' && item.status !== 'assigned') return;
            if (statusFilter === 'returned' && item.status !== 'returned') return;

            const name = String(item.personnel_name || '').toLowerCase();
            if (query && !name.includes(query)) return;

            const key = item.personnel_id || item.personnel_name;
            if (!map.has(key)) {
                map.set(key, {
                    personnel_id: item.personnel_id,
                    personnel_name: item.personnel_name,
                    assigned: 0,
                    returned: 0,
                    total: 0,
                });
            }
            const group = map.get(key);
            group.total += 1;
            if (item.status === 'assigned') group.assigned += 1;
            else group.returned += 1;
        });

        return [...map.values()].sort((a, b) =>
            String(a.personnel_name).localeCompare(String(b.personnel_name), 'tr')
        );
    }, [inventory, search, statusFilter]);

    const openPersonDetail = useCallback(async (person) => {
        setSelectedPerson(person);
        setProfile(null);
        setItemEdits({});
        setProfileLoading(true);
        try {
            const res = await api.get(`/api/admin/personnel/${person.personnel_id}`);
            setProfile(res.data);
            const edits = {};
            (res.data.items || []).forEach((item) => {
                edits[item.id] = {
                    it_notes: item.it_notes || '',
                    condition: item.condition || 'undamaged',
                };
            });
            setItemEdits(edits);
        } catch {
            alert(t('admin.personnelDetailError'));
            setSelectedPerson(null);
        } finally {
            setProfileLoading(false);
        }
    }, [t]);

    const saveItemMeta = async (itemId) => {
        const edit = itemEdits[itemId];
        if (!edit) return;
        setSavingItemId(itemId);
        try {
            await api.put(`/api/admin/inventory/${itemId}`, {
                it_notes: edit.it_notes,
                condition: edit.condition,
            });
            await openPersonDetail(selectedPerson);
            onRefresh();
        } catch {
            alert(t('admin.personnelSaveError'));
        } finally {
            setSavingItemId(null);
        }
    };

    const updateItemEdit = (itemId, field, value) => {
        setItemEdits((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value },
        }));
    };

    const cargoStatusLabel = (cargo) => {
        if (cargo.delivery_date || cargo.recipient) return t('admin.cargoDelivered');
        if (cargo.return_flag || cargo.return_reason) return t('admin.cargoReturned');
        return t('admin.cargoInTransit');
    };

    return (
        <>
            <Card className="border-2">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle>{t('admin.inventory')}</CardTitle>
                            <CardDescription>{t('admin.inventoryDescGrouped')}</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                            {canWrite && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        onChange={onExcelSelect}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl"
                                        onClick={onImportClick}
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
                    <div className="flex flex-wrap gap-2 pt-2">
                        {['all', 'assigned', 'returned'].map((filter) => (
                            <Button
                                key={filter}
                                type="button"
                                size="sm"
                                variant={statusFilter === filter ? 'default' : 'outline'}
                                className={statusFilter === filter ? 'bg-red-600 hover:bg-red-700' : ''}
                                onClick={() => onStatusFilterChange(filter)}
                            >
                                {t(`admin.inventoryFilter.${filter}`)}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-left">
                                    <th className="p-4">{t('admin.personnelId')}</th>
                                    <th className="p-4">{t('admin.personnelName')}</th>
                                    <th className="p-4">{t('admin.activeItems')}</th>
                                    <th className="p-4">{t('admin.returnedItemsCount')}</th>
                                    <th className="p-4">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personnelGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            {search.trim() ? t('admin.noSearchResults') : t('admin.noRecords')}
                                        </td>
                                    </tr>
                                ) : (
                                    personnelGroups.map((person) => (
                                        <tr
                                            key={person.personnel_id}
                                            className="border-b hover:bg-gray-50 cursor-pointer"
                                            onClick={() => openPersonDetail(person)}
                                        >
                                            <td className="p-4 font-mono">{person.personnel_id}</td>
                                            <td className="p-4 font-medium">{person.personnel_name}</td>
                                            <td className="p-4">
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                                    {person.assigned}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                    {person.returned}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Button variant="ghost" size="sm" className="text-red-600">
                                                    {t('admin.viewDetail')}
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={Boolean(selectedPerson)} onOpenChange={(open) => !open && setSelectedPerson(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{profile?.personnel_name || selectedPerson?.personnel_name}</DialogTitle>
                        <DialogDescription className="font-mono">
                            {t('admin.personnelId')}: {profile?.personnel_id || selectedPerson?.personnel_id}
                        </DialogDescription>
                    </DialogHeader>

                    {profileLoading ? (
                        <p className="text-center text-gray-500 py-8">...</p>
                    ) : profile && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3">
                                <Badge className={profile.is_confirmed ? 'bg-green-600 text-white' : 'bg-orange-100 text-orange-800'}>
                                    {profile.is_confirmed ? t('admin.digitalConfirmed') : t('admin.confirmationPending')}
                                </Badge>
                                {profile.cargo_outgoing?.length > 0 && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                        <Truck className="w-3 h-3 mr-1" />
                                        {profile.cargo_outgoing.length} {t('admin.outgoingCargo')}
                                    </Badge>
                                )}
                                {profile.cargo_incoming?.length > 0 && (
                                    <Badge className="bg-purple-100 text-purple-800">
                                        {profile.cargo_incoming.length} {t('admin.incomingCargo')}
                                    </Badge>
                                )}
                            </div>

                            <section>
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-red-600" />
                                    {t('admin.personnelAssets')}
                                </h3>
                                <div className="space-y-4">
                                    {profile.items.map((item) => (
                                        <div key={item.id} className="border rounded-xl p-4 bg-gray-50/50 space-y-3">
                                            <div className="flex flex-wrap justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold">{item.item_name}</p>
                                                    <p className="text-sm text-gray-500 font-mono">S/N: {item.serial_number}</p>
                                                </div>
                                                <Badge className={item.status === 'assigned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                                    {item.status === 'assigned' ? t('admin.assigned') : t('admin.returned')}
                                                </Badge>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 block mb-1">
                                                        {t('admin.condition')}
                                                    </label>
                                                    <select
                                                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                                                        value={itemEdits[item.id]?.condition || 'undamaged'}
                                                        disabled={!canWrite}
                                                        onChange={(e) => updateItemEdit(item.id, 'condition', e.target.value)}
                                                    >
                                                        {CONDITION_OPTIONS.map((opt) => (
                                                            <option key={opt} value={opt}>
                                                                {t(`admin.conditionOptions.${opt}`)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 block mb-1">
                                                        {t('admin.returnNote')}
                                                    </label>
                                                    <p className="text-sm text-gray-700 border rounded-lg px-3 py-2 bg-white min-h-[38px]">
                                                        {item.return_note || '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-500 block mb-1">
                                                    {t('admin.itNotes')}
                                                </label>
                                                <textarea
                                                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px] bg-white"
                                                    value={itemEdits[item.id]?.it_notes || ''}
                                                    disabled={!canWrite}
                                                    onChange={(e) => updateItemEdit(item.id, 'it_notes', e.target.value)}
                                                    placeholder={t('admin.itNotesPlaceholder')}
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {canWrite && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={savingItemId === item.id}
                                                            onClick={() => saveItemMeta(item.id)}
                                                        >
                                                            {savingItemId === item.id ? '...' : t('admin.saveNotes')}
                                                        </Button>
                                                        {item.status === 'assigned' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-green-600"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await onReturnAsset(item.id);
                                                                    if (selectedPerson) await openPersonDetail(selectedPerson);
                                                                }}
                                                            >
                                                                <ArrowLeftRight className="w-4 h-4 mr-1" />
                                                                {t('admin.returnButton')}
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {profile.cargo_outgoing?.length > 0 && (
                                <section>
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-orange-600" />
                                        {t('admin.cargoStatusSection')}
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.cargo_outgoing.map((cargo) => (
                                            <div key={cargo.id} className="border rounded-lg p-3 text-sm flex flex-wrap justify-between gap-2">
                                                <div>
                                                    <p className="font-medium">{cargo.item_name}</p>
                                                    <p className="text-gray-500 font-mono">S/N: {cargo.serial_number}</p>
                                                    {cargo.delivery_date && (
                                                        <p className="text-gray-600 mt-1">
                                                            {t('admin.deliveredAt')}: {cargo.delivery_date}
                                                            {cargo.delivery_time ? ` ${cargo.delivery_time}` : ''}
                                                            {cargo.recipient ? ` — ${cargo.recipient}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge className="shrink-0 h-fit">{cargoStatusLabel(cargo)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {profile.cargo_incoming?.length > 0 && (
                                <section>
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        {t('admin.incomingCargoSection')}
                                    </h3>
                                    <div className="space-y-2">
                                        {profile.cargo_incoming.map((cargo) => (
                                            <div key={cargo.id} className="border rounded-lg p-3 text-sm">
                                                <p className="font-medium">{cargo.item_name}</p>
                                                <p className="text-gray-500 font-mono">S/N: {cargo.serial_number}</p>
                                                {cargo.return_reason && (
                                                    <p className="text-orange-700 mt-1">{cargo.return_reason}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {!profile.items?.length && (
                                <AlertCircle className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedPerson(null)}>
                            {t('admin.importCancel')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PersonnelInventoryPanel;
