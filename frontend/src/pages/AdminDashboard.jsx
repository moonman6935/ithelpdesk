import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
    User, PlusCircle, CheckCircle2, LayoutDashboard, Package,
    RefreshCcw, Users, ArrowLeftRight, LogOut, Dices, KeyRound, Upload,
    Truck, PackageCheck, Megaphone, Video, Images, Printer, Clock, FileCog,
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import { readExcelFile } from '../lib/excelImport';
import { batchImport, getImportErrorMessage } from '../lib/batchImport';
import { printZimmetForm } from '../lib/zimmetFormPrint';
import api from '../lib/api';
import CargoPanel from '../components/CargoPanel';
import AnnouncementAdmin from '../components/AnnouncementAdmin';
import VideoTutorialsAdmin from '../components/VideoTutorialsAdmin';
import CarouselSlidesAdmin from '../components/CarouselSlidesAdmin';
import PersonnelInventoryPanel from '../components/PersonnelInventoryPanel';
import PendingConfirmationsPanel from '../components/PendingConfirmationsPanel';
import ToolFilesPanel from '../components/ToolFilesPanel';
import UserManagementPanel from '../components/UserManagementPanel';
import {
    loadStoredPermissions,
    clearSessionAuth,
    storeSessionAuth,
    canView as canViewModule,
    canWrite as canWriteModule,
    defaultPermissionsForRole,
} from '../lib/adminPermissions';
import { useNavigate } from 'react-router-dom';

const TAB_MODULE_MAP = {
    dashboard: 'dashboard',
    add: 'assets',
    inventory: 'inventory',
    'outgoing-cargo': 'outgoing_cargo',
    'incoming-cargo': 'incoming_cargo',
    'pending-confirmations': 'confirmations',
    confirmations: 'confirmations',
    announcement: 'announcement',
    'video-tutorials': 'video_tutorials',
    'carousel-slides': 'carousel',
    'tool-files': 'tools',
};

const TAB_ORDER = [
    'dashboard', 'add', 'inventory', 'outgoing-cargo', 'incoming-cargo',
    'pending-confirmations', 'confirmations', 'users', 'announcement', 'video-tutorials', 'carousel-slides', 'tool-files', 'account',
];

function canViewTab(tab, perms, sysAdmin) {
    if (tab === 'account') return true;
    if (tab === 'users') return sysAdmin;
    const module = TAB_MODULE_MAP[tab];
    return module ? (sysAdmin || canViewModule(perms, module)) : false;
}

function pickFirstAvailableTab(perms, sysAdmin) {
    return TAB_ORDER.find((tab) => canViewTab(tab, perms, sysAdmin)) || 'account';
}

const AdminDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [personnelId, setPersonnelId] = useState('');
    const [personnelName, setPersonnelName] = useState('');
    const [items, setItems] = useState([{ itemName: '', serialNo: '' }]);
    const [confirmations, setConfirmations] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');
    const [stats, setStats] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [isSystemAdmin, setIsSystemAdmin] = useState(false);
    const [permissions, setPermissions] = useState(() =>
        loadStoredPermissions() || defaultPermissionsForRole(localStorage.getItem('admin_role') || 'viewer')
    );
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [importPreview, setImportPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [printingForm, setPrintingForm] = useState(false);
    const [productNames, setProductNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const permissionsRef = useRef(permissions);
    const isSystemAdminRef = useRef(isSystemAdmin);
    const fetchAdminDataRef = useRef(null);

    permissionsRef.current = permissions;
    isSystemAdminRef.current = isSystemAdmin;

    const applySettledResults = (results) => {
        let unauthorized = false;
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const { key, data } = result.value;
                if (key === 'stats') setStats(data);
                if (key === 'confirmations') setConfirmations(data);
                if (key === 'inventory') setInventory(data);
                if (key === 'users') setAdmins(data);
                if (key === 'productNames') setProductNames(data);
            } else if (result.reason?.response?.status === 401) {
                unauthorized = true;
            }
        }
        return unauthorized;
    };

    const fetchAdminData = useCallback(async () => {
        const sysAdmin = isSystemAdminRef.current;
        const tasks = [
            api.get('/api/admin/stats').then((r) => ({ key: 'stats', data: r.data })),
            api.get('/api/admin/confirmations').then((r) => ({ key: 'confirmations', data: r.data })),
            api.get('/api/admin/inventory').then((r) => ({ key: 'inventory', data: r.data })),
            api.get('/api/admin/product-names').then((r) => ({ key: 'productNames', data: r.data })),
        ];
        if (sysAdmin) {
            tasks.push(api.get('/api/admin/users').then((r) => ({ key: 'users', data: r.data })));
        }
        if (applySettledResults(await Promise.allSettled(tasks))) {
            navigate('/login');
        }
    }, [navigate]);

    fetchAdminDataRef.current = fetchAdminData;

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return undefined;
        }

        let cancelled = false;
        const role = localStorage.getItem('admin_role') || 'viewer';
        const perms = loadStoredPermissions() || defaultPermissionsForRole(role);
        const sysAdmin = role === 'system_admin';

        permissionsRef.current = perms;
        isSystemAdminRef.current = sysAdmin;
        setIsSystemAdmin(sysAdmin);
        setPermissions(perms);
        setActiveTab(pickFirstAvailableTab(perms, sysAdmin));

        (async () => {
            try {
                await fetchAdminDataRef.current?.();
            } finally {
                if (!cancelled) setLoading(false);
            }

            api.get('/api/admin/me')
                .then(({ data }) => {
                    if (cancelled) return;
                    storeSessionAuth({ role: data.role, permissions: data.permissions });
                    const refreshedSysAdmin = data.role === 'system_admin';
                    permissionsRef.current = data.permissions;
                    isSystemAdminRef.current = refreshedSysAdmin;
                    setIsSystemAdmin(refreshedSysAdmin);
                    setPermissions(data.permissions);
                    setActiveTab((current) => (
                        canViewTab(current, data.permissions, refreshedSysAdmin)
                            ? current
                            : pickFirstAvailableTab(data.permissions, refreshedSysAdmin)
                    ));
                    fetchAdminDataRef.current?.();
                })
                .catch(() => {});
        })();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    useEffect(() => {
        if (!canViewTab(activeTab, permissions, isSystemAdmin)) {
            setActiveTab(pickFirstAvailableTab(permissions, isSystemAdmin));
        }
    }, [activeTab, permissions, isSystemAdmin]);

    const canView = (module) => isSystemAdmin || canViewModule(permissions, module);
    const canWrite = (module) => isSystemAdmin || canWriteModule(permissions, module);

    const goToInventory = (filter = 'all') => {
        if (!canView('inventory')) return;
        setInventoryStatusFilter(filter);
        setActiveTab('inventory');
    };

    const fetchProductNames = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/product-names');
            setProductNames(res.data);
        } catch {
            console.error('Ürün adları alınamadı');
        }
    }, []);

    // Intelligent ID fetcher
    useEffect(() => {
        const canWriteAssets = isSystemAdmin || canWriteModule(permissions, 'assets');
        if (!canWriteAssets) return undefined;

        if (!personnelName.trim()) {
            setPersonnelId('');
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const searchRes = await api.get(`/api/admin/personnel/search?name=${encodeURIComponent(personnelName)}`);
                if (searchRes.data.personnel_id) {
                    setPersonnelId(searchRes.data.personnel_id);
                } else {
                    const nextIdRes = await api.get('/api/admin/next-personnel-id');
                    setPersonnelId(nextIdRes.data.next_id);
                }
            } catch (err) {
                console.error('ID anlık üretilemedi');
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [personnelName, permissions, isSystemAdmin]);

    const handleRandomId = async () => {
        try {
            const res = await api.get('/api/admin/random-personnel-id');
            setPersonnelId(res.data.random_id);
        } catch (err) {
            console.error('Rastgele ID üretilemedi');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        clearSessionAuth();
        navigate('/login');
    };

    const addItemRow = () => {
        setItems([...items, { itemName: '', serialNo: '' }]);
    };

    const removeItemRow = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems.length ? newItems : [{ itemName: '', serialNo: '' }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        try {
            const payload = items.map(item => ({
                personnel_id: personnelId,
                personnel_name: personnelName,
                item_name: item.itemName,
                serial_number: item.serialNo
            }));

            await api.post('/api/admin/inventory/bulk', payload);
            alert('Zimmetler başarıyla eklendi ve onay durumu sıfırlandı.');
            setPersonnelId('');
            setPersonnelName('');
            setItems([{ itemName: '', serialNo: '' }]);
            fetchAdminData();
            fetchProductNames();
        } catch (err) {
            alert('Zimmet eklenirken hata oluştu');
        }
    };

    const resetConfirmation = async (pId) => {
        if (window.confirm(`${pId} için onay durumunu sıfırlamak istediğinize emin misiniz?`)) {
            try {
                await api.post(`/api/admin/inventory/reset-confirmation?personnel_id=${pId}`);
                alert('Onay sıfırlandı.');
                fetchAdminData();
            } catch (err) {
                alert('Hata oluştu.');
            }
        }
    };

    const handleReturnAsset = async (itemId) => {
        const note = window.prompt("İade notu (İsteğe bağlı):", "Sorunsuz iade");
        if (note !== null) {
            try {
                await api.post(`/api/admin/inventory/return?item_id=${itemId}&note=${encodeURIComponent(note)}`);
                fetchAdminData();
            } catch (err) {
                alert('İade işlemi başarısız');
            }
        }
    };


    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            alert('Yeni şifreler eşleşmiyor');
            return;
        }
        try {
            await api.post('/api/admin/change-password', {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            alert('Şifre başarıyla değiştirildi. Lütfen tekrar giriş yapın.');
            handleLogout();
        } catch (err) {
            alert(err.response?.data?.detail || 'Şifre değiştirilemedi');
        }
    };

    const handlePrintZimmetForm = async () => {
        const filledItems = items.filter((item) => item.itemName?.trim());
        if (!personnelName.trim()) {
            alert(t('admin.printFormMissingName'));
            return;
        }
        if (!filledItems.length) {
            alert(t('admin.printFormMissingItems'));
            return;
        }

        setPrintingForm(true);
        try {
            await printZimmetForm({ personnelName, items: filledItems });
        } catch (err) {
            const code = err?.message;
            if (code === 'POPUP_BLOCKED') {
                alert(t('admin.printFormPopupBlocked'));
            } else if (code === 'TEMPLATE_NOT_FOUND') {
                alert(t('admin.printFormTemplateMissing'));
            } else {
                alert(t('admin.printFormError'));
            }
            console.error(err);
        } finally {
            setPrintingForm(false);
        }
    };

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
            setImportPreview({ ...result, fileName: file.name, cargoDirection: 'outgoing' });
        } catch (err) {
            alert(t('admin.importError'));
            console.error(err);
        }
    };

    const handleConfirmImport = async () => {
        if (!importPreview?.items?.length) return;

        if (importPreview.format === 'cargo' && !importPreview.cargoDirection) {
            alert(t('admin.cargoImportSelectDirection'));
            return;
        }

        setImporting(true);
        try {
            if (importPreview.format === 'cargo') {
                const { imported, skipped } = await batchImport(
                    '/api/admin/cargo/import',
                    { direction: importPreview.cargoDirection },
                    importPreview.items
                );
                alert(`${imported} ${t('admin.importSuccess')}${skipped ? `, ${skipped} ${t('admin.importSkipped')}` : ''}`);
            } else {
                const { imported, skipped } = await batchImport(
                    '/api/admin/inventory/import',
                    {},
                    importPreview.items
                );
                alert(`${imported} ${t('admin.importSuccess')}${skipped ? `, ${skipped} ${t('admin.importSkipped')}` : ''}`);
            }
            setImportPreview(null);
            fetchAdminData();
        } catch (err) {
            alert(getImportErrorMessage(err, t('admin.importError')));
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="min-h-screen py-12">
            <div className="site-container">
                {loading ? (
                    <div className="flex items-center justify-center py-24 text-gray-500">
                        Yükleniyor...
                    </div>
                ) : (
                <>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <User className="w-10 h-10 text-red-600" />
                        {t('admin.title')}
                    </h1>
                    <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200">
                        <LogOut className="w-4 h-4 mr-2" /> {t('admin.logout')}
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="glass-panel p-1 flex-wrap h-auto border-0 shadow-md">
                        {canView('dashboard') && (
                        <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                            <LayoutDashboard className="w-4 h-4 mr-2" /> {t('admin.dashboard')}
                        </TabsTrigger>
                        )}
                        {canView('assets') && (
                        <TabsTrigger value="add" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                            <PlusCircle className="w-4 h-4 mr-2" /> {t('admin.addAsset')}
                        </TabsTrigger>
                        )}
                        {canView('inventory') && (
                        <TabsTrigger value="inventory" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                            <Package className="w-4 h-4 mr-2" /> {t('admin.inventory')}
                        </TabsTrigger>
                        )}
                        {canView('outgoing_cargo') && (
                        <TabsTrigger value="outgoing-cargo" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                            <Truck className="w-4 h-4 mr-2" /> {t('admin.outgoingCargo')}
                        </TabsTrigger>
                        )}
                        {canView('incoming_cargo') && (
                        <TabsTrigger value="incoming-cargo" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                            <PackageCheck className="w-4 h-4 mr-2" /> {t('admin.incomingCargo')}
                        </TabsTrigger>
                        )}
                        {canView('confirmations') && (
                        <TabsTrigger value="pending-confirmations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white px-6 transition-all">
                            <Clock className="w-4 h-4 mr-2" /> {t('admin.pendingConfirmations')}
                        </TabsTrigger>
                        )}
                        {canView('confirmations') && (
                        <TabsTrigger value="confirmations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> {t('admin.confirmations')}
                        </TabsTrigger>
                        )}
                        {isSystemAdmin && (
                            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                                <Users className="w-4 h-4 mr-2" /> {t('admin.userMgmt.tab')}
                            </TabsTrigger>
                        )}
                        {canView('announcement') && (
                            <TabsTrigger value="announcement" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                                <Megaphone className="w-4 h-4 mr-2" /> {t('admin.announcement.tab')}
                            </TabsTrigger>
                        )}
                        {canView('video_tutorials') && (
                            <TabsTrigger value="video-tutorials" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                                <Video className="w-4 h-4 mr-2" /> {t('admin.videoTutorials.tab')}
                            </TabsTrigger>
                        )}
                        {canView('carousel') && (
                            <TabsTrigger value="carousel-slides" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                                <Images className="w-4 h-4 mr-2" /> {t('admin.carousel.tab')}
                            </TabsTrigger>
                        )}
                        {canView('tools') && (
                            <TabsTrigger value="tool-files" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                                <FileCog className="w-4 h-4 mr-2" /> {t('admin.toolFiles.tab')}
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="account" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white px-6 transition-all">
                            <KeyRound className="w-4 h-4 mr-2" /> {t('admin.passwordTab')}
                        </TabsTrigger>
                    </TabsList>

                    {canView('dashboard') && (
                    <TabsContent value="dashboard">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card
                                className="border-l-4 border-l-blue-500 cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => goToInventory('all')}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.totalPersonnel')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{stats?.total_personnel_with_assets || 0}</p>
                                </CardContent>
                            </Card>
                            <Card
                                className="border-l-4 border-l-red-500 cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => goToInventory('assigned')}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.totalItems')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{stats?.total_assigned_items || 0}</p>
                                </CardContent>
                            </Card>
                            <Card
                                className="border-l-4 border-l-green-500 cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => goToInventory('returned')}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.returnedItems')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{stats?.total_returned_items || 0}</p>
                                </CardContent>
                            </Card>
                            <Card
                                className="border-l-4 border-l-orange-500 cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => setActiveTab('pending-confirmations')}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.pending')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-orange-600">{stats?.pending_confirmations || 0}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    )}

                    {canView('assets') && (
                    <TabsContent value="add">
                        <Card className="max-w-3xl mx-auto border-2">
                            <CardHeader>
                                <CardTitle>{t('admin.addAsset')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddAsset} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                                        <div>
                                            <label className="block text-sm font-bold mb-2">{t('admin.personnelId')}</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={personnelId}
                                                    onChange={(e) => setPersonnelId(e.target.value)}
                                                    required
                                                    placeholder="Örn: 123456"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handleRandomId}
                                                    title="Rastgele Üret"
                                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Dices className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">{t('admin.personnelName')}</label>
                                            <Input
                                                value={personnelName}
                                                onChange={(e) => setPersonnelName(e.target.value)}
                                                required
                                                placeholder="Ad Soyad"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg">{t('admin.productList')}</h3>
                                            <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="border-red-600 text-red-600">
                                                <PlusCircle className="w-4 h-4 mr-2" /> {t('admin.addRow')}
                                            </Button>
                                        </div>

                                        <datalist id="product-name-suggestions">
                                            {productNames.map((name) => (
                                                <option key={name} value={name} />
                                            ))}
                                        </datalist>

                                        {items.map((item, index) => (
                                            <div key={index} className="flex gap-4 items-end bg-white p-4 border rounded shadow-sm relative group">
                                                <div className="flex-[2]">
                                                    <label className="block text-xs font-medium mb-1">{t('admin.itemName')}</label>
                                                    <Input
                                                        value={item.itemName}
                                                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                                        list="product-name-suggestions"
                                                        required
                                                        placeholder="Örn: Dell Monitör"
                                                    />
                                                </div>
                                                <div className="flex-[1]">
                                                    <label className="block text-xs font-medium mb-1">{t('admin.serialNo')}</label>
                                                    <Input
                                                        value={item.serialNo}
                                                        onChange={(e) => handleItemChange(index, 'serialNo', e.target.value)}
                                                        required
                                                        placeholder="SN123456"
                                                    />
                                                </div>
                                                {items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => removeItemRow(index)}
                                                        className="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                                                    >
                                                        ×
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 py-6 text-lg border-gray-300"
                                            onClick={handlePrintZimmetForm}
                                            disabled={printingForm}
                                        >
                                            <Printer className="w-5 h-5 mr-2" />
                                            {printingForm ? '...' : t('admin.printForm')}
                                        </Button>
                                        <Button type="submit" className="flex-1 bg-red-600 py-6 text-lg">
                                            {t('admin.submit')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    )}

                    <TabsContent value="inventory">
                        <PersonnelInventoryPanel
                            inventory={inventory}
                            statusFilter={inventoryStatusFilter}
                            onStatusFilterChange={setInventoryStatusFilter}
                            canWrite={canWrite('inventory')}
                            onImportClick={() => fileInputRef.current?.click()}
                            fileInputRef={fileInputRef}
                            onExcelSelect={handleExcelFileSelect}
                            onRefresh={fetchAdminData}
                            onReturnAsset={handleReturnAsset}
                        />
                    </TabsContent>

                    <TabsContent value="outgoing-cargo">
                        <CargoPanel direction="outgoing" canWrite={canWrite('outgoing_cargo')} />
                    </TabsContent>

                    <TabsContent value="incoming-cargo">
                        <CargoPanel direction="incoming" canWrite={canWrite('incoming_cargo')} />
                    </TabsContent>

                    <TabsContent value="pending-confirmations">
                        <PendingConfirmationsPanel
                            inventory={inventory}
                            confirmations={confirmations}
                        />
                    </TabsContent>

                    <TabsContent value="confirmations">
                        <div className="grid gap-6">
                            {confirmations.map((conf) => (
                                <Card key={conf.id} className="border-2 overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="p-6 flex-1">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Badge className={conf.status === 'confirmed' ? "bg-green-600 text-white" : "bg-gray-400 text-white"}>
                                                        {conf.status === 'confirmed' ? t('admin.confirmed') : t('admin.reset')}
                                                    </Badge>
                                                    <span className="text-gray-500 text-sm">{new Date(conf.confirmed_at).toLocaleString()}</span>
                                                </div>
                                                <h3 className="text-2xl font-bold mb-1">{conf.personnel_name}</h3>
                                                <p className="text-gray-500 font-mono mb-4">ID: {conf.personnel_id}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {conf.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                                                            <Package className="w-4 h-4 text-red-600" />
                                                            <div>
                                                                <p className="font-bold text-sm">{item.item_name}</p>
                                                                <p className="text-xs text-gray-500">S/N: {item.serial_number}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-6 flex items-center justify-center border-l">
                                                {canWrite('confirmations') && conf.status === 'confirmed' && (
                                                    <Button
                                                        onClick={() => resetConfirmation(conf.personnel_id)}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white"
                                                    >
                                                        <RefreshCcw className="w-4 h-4 mr-2" /> {t('admin.resetConfirm')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {isSystemAdmin && (
                        <TabsContent value="users">
                            <UserManagementPanel
                                users={admins}
                                onRefresh={fetchAdminData}
                                currentUsername={localStorage.getItem('admin_username') || ''}
                            />
                        </TabsContent>
                    )}

                    {canView('announcement') && (
                    <TabsContent value="announcement">
                        <AnnouncementAdmin />
                    </TabsContent>
                    )}

                    {canView('video_tutorials') && (
                    <TabsContent value="video-tutorials">
                        <VideoTutorialsAdmin />
                    </TabsContent>
                    )}

                    {canView('carousel') && (
                    <TabsContent value="carousel-slides">
                        <CarouselSlidesAdmin />
                    </TabsContent>
                    )}

                    {canView('tools') && (
                    <TabsContent value="tool-files">
                        <ToolFilesPanel canWrite={canWrite('tools')} />
                    </TabsContent>
                    )}

                    <TabsContent value="account">
                        <Card className="max-w-md border-2">
                            <CardHeader>
                                <CardTitle>{t('admin.changePassword')}</CardTitle>
                                <CardDescription>
                                    Kullanıcı: <strong>{localStorage.getItem('admin_username') || 'admin'}</strong>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('admin.currentPassword')}</label>
                                        <Input
                                            type="password"
                                            value={passwordForm.current_password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('admin.newPassword')}</label>
                                        <Input
                                            type="password"
                                            value={passwordForm.new_password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('admin.confirmNewPassword')}</label>
                                        <Input
                                            type="password"
                                            value={passwordForm.confirm_password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                                        {t('admin.updatePassword')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                </>
                )}

            <Dialog open={Boolean(importPreview)} onOpenChange={(open) => !open && setImportPreview(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('admin.importPreview')}</DialogTitle>
                        <DialogDescription>
                            {importPreview?.fileName} — {importPreview?.items?.length} {t('admin.importRowsFound')}
                            {' · '}
                            {importPreview?.format === 'cargo' ? t('admin.importFormatCargo') : t('admin.importFormatDirect')}
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
                    {(importPreview?.items?.length ?? 0) > 10 && (
                        <p className="text-sm text-gray-500">
                            +{(importPreview.items.length - 10)} kayıt daha...
                        </p>
                    )}
                    {importPreview?.format === 'cargo' && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
                            <p className="text-sm font-medium text-orange-900">{t('admin.cargoImportSelectDirection')}</p>
                            <div className="flex flex-wrap gap-3">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="cargoDirection"
                                        value="outgoing"
                                        checked={importPreview.cargoDirection === 'outgoing'}
                                        onChange={() => setImportPreview((prev) => ({ ...prev, cargoDirection: 'outgoing' }))}
                                    />
                                    {t('admin.outgoingCargo')}
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="cargoDirection"
                                        value="incoming"
                                        checked={importPreview.cargoDirection === 'incoming'}
                                        onChange={() => setImportPreview((prev) => ({ ...prev, cargoDirection: 'incoming' }))}
                                    />
                                    {t('admin.incomingCargo')}
                                </label>
                            </div>
                            <p className="text-xs text-orange-800">{t('admin.cargoImportHint')}</p>
                        </div>
                    )}
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
            </div>
        </div>
    );
};

export default AdminDashboard;
