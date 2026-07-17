import React, { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Search, X, ChevronRight, Package, Clock, AlertCircle } from 'lucide-react';

function buildPendingGroups(inventory, confirmations) {
    const confirmedIds = new Set(
        confirmations
            .filter((c) => c.status === 'confirmed')
            .map((c) => String(c.personnel_id))
    );

    const map = new Map();

    inventory.forEach((item) => {
        if (item.status !== 'assigned') return;

        const pid = String(item.personnel_id);
        if (confirmedIds.has(pid)) return;

        if (!map.has(pid)) {
            map.set(pid, {
                personnel_id: pid,
                personnel_name: item.personnel_name,
                items: [],
                latest_assigned_at: null,
            });
        }

        const group = map.get(pid);
        group.items.push(item);

        const created = item.created_at ? new Date(item.created_at).getTime() : 0;
        if (!group.latest_assigned_at || created > group.latest_assigned_at) {
            group.latest_assigned_at = created;
        }
    });

    return [...map.values()].sort((a, b) =>
        String(a.personnel_name).localeCompare(String(b.personnel_name), 'tr')
    );
}

const PendingConfirmationsPanel = ({ inventory, confirmations }) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    const pendingGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        return buildPendingGroups(inventory, confirmations).filter((person) => {
            if (!query) return true;
            const name = String(person.personnel_name || '').toLowerCase();
            const id = String(person.personnel_id || '').toLowerCase();
            return name.includes(query) || id.includes(query);
        });
    }, [inventory, confirmations, search]);

    const formatDate = (ts) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <>
            <Card className="border-2 border-orange-200">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                {t('admin.pendingConfirmations')}
                            </CardTitle>
                            <CardDescription>{t('admin.pendingConfirmationsDesc')}</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-72 shrink-0">
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
                    <div className="pt-2">
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-sm px-3 py-1">
                            {pendingGroups.length} {t('admin.pendingConfirmationsCount')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-orange-50/60 text-left">
                                    <th className="p-4">{t('admin.personnelId')}</th>
                                    <th className="p-4">{t('admin.personnelName')}</th>
                                    <th className="p-4">{t('admin.activeItems')}</th>
                                    <th className="p-4">{t('admin.pendingSince')}</th>
                                    <th className="p-4">{t('admin.confirmationStatus')}</th>
                                    <th className="p-4">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-10 text-center text-gray-500">
                                            {search.trim() ? t('admin.noSearchResults') : t('admin.pendingEmpty')}
                                        </td>
                                    </tr>
                                ) : (
                                    pendingGroups.map((person) => (
                                        <tr
                                            key={person.personnel_id}
                                            className="border-b hover:bg-orange-50/40 cursor-pointer"
                                            onClick={() => setSelected(person)}
                                        >
                                            <td className="p-4 font-mono">{person.personnel_id}</td>
                                            <td className="p-4 font-medium">{person.personnel_name}</td>
                                            <td className="p-4">
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                                    {person.items.length}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                                                    {formatDate(person.latest_assigned_at)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                                                    {t('admin.confirmationPending')}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelected(person);
                                                    }}
                                                >
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

            <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.personnel_name}</DialogTitle>
                                <DialogDescription>
                                    {t('admin.personnelId')}: {selected.personnel_id}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                                    {t('admin.confirmationPending')}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                    {selected.items.length} {t('admin.pendingItemsLabel')}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {selected.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50"
                                    >
                                        <Package className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm">{item.item_name}</p>
                                            <p className="text-xs text-gray-500 font-mono">S/N: {item.serial_number}</p>
                                            {item.created_at && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {t('admin.assignedAt')}: {new Date(item.created_at).toLocaleString('tr-TR')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-sm text-gray-500 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                {t('admin.pendingHint')}
                            </p>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PendingConfirmationsPanel;
