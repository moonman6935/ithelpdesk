import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
    User, PlusCircle, CheckCircle2, LayoutDashboard, Package,
    RefreshCcw, Users, Trash2, ArrowLeftRight, LogOut, Dices
} from "lucide-react";
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [personnelId, setPersonnelId] = useState('');
    const [personnelName, setPersonnelName] = useState('');
    const [items, setItems] = useState([{ itemName: '', serialNo: '' }]);
    const [confirmations, setConfirmations] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [isSystemAdmin, setIsSystemAdmin] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'admin' });

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const role = localStorage.getItem('admin_role');
        if (!token) {
            navigate('/login');
            return;
        }
        setIsSystemAdmin(role === 'system_admin');
        fetchAdminData();
    }, [navigate]);

    // Intelligent ID fetcher
    useEffect(() => {
        const fetchNextId = async () => {
            if (!personnelName.trim()) {
                setPersonnelId('');
                return;
            }

            const timeoutId = setTimeout(async () => {
                try {
                    // 1. Search if name already exists
                    const searchRes = await api.get(`/api/admin/personnel/search?name=${encodeURIComponent(personnelName)}`);
                    if (searchRes.data.personnel_id) {
                        setPersonnelId(searchRes.data.personnel_id);
                    } else {
                        // 2. If not, fetch next available ID
                        const nextIdRes = await api.get('/api/admin/next-personnel-id');
                        setPersonnelId(nextIdRes.data.next_id);
                    }
                } catch (err) {
                    console.error('ID anlık üretilemedi');
                }
            }, 500); // 500ms debounce

            return () => clearTimeout(timeoutId);
        };

        fetchNextId();
    }, [personnelName]);

    const handleRandomId = async () => {
        try {
            const res = await api.get('/api/admin/random-personnel-id');
            setPersonnelId(res.data.random_id);
        } catch (err) {
            console.error('Rastgele ID üretilemedi');
        }
    };

    const fetchAdminData = async () => {
        try {
            const [confRes, invRes, statRes] = await Promise.all([
                api.get('/api/admin/confirmations'),
                api.get('/api/admin/inventory'),
                api.get('/api/admin/stats')
            ]);
            setConfirmations(confRes.data);
            setInventory(invRes.data);
            setStats(statRes.data);

            const role = localStorage.getItem('admin_role');
            if (role === 'system_admin') {
                const userRes = await api.get('/api/admin/users');
                setAdmins(userRes.data);
            }
        } catch (err) {
            console.error('Veri çekilemedi');
            if (err.response?.status === 401) navigate('/login');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
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

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/users', newAdmin);
            alert('Yönetici eklendi');
            setNewAdmin({ username: '', password: '', role: 'admin' });
            fetchAdminData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Hata oluştu');
        }
    };

    const deleteAdmin = async (username) => {
        if (window.confirm('Bu yöneticiyi silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/api/admin/users/${username}`);
                fetchAdminData();
            } catch (err) {
                alert(err.response?.data?.detail || 'Hata oluştu');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <User className="w-10 h-10 text-red-600" />
                        {t('admin.title')}
                    </h1>
                    <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200">
                        <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
                    </Button>
                </div>

                <Tabs defaultValue="dashboard" className="space-y-6">
                    <TabsList className="bg-white border-2 border-gray-100 p-1 flex-wrap h-auto">
                        <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-600 data-[state=active]:text-white px-6">
                            <LayoutDashboard className="w-4 h-4 mr-2" /> {t('admin.dashboard')}
                        </TabsTrigger>
                        <TabsTrigger value="add" className="data-[state=active]:bg-red-600 data-[state=active]:text-white px-6">
                            <PlusCircle className="w-4 h-4 mr-2" /> {t('admin.addAsset')}
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="data-[state=active]:bg-red-600 data-[state=active]:text-white px-6">
                            <Package className="w-4 h-4 mr-2" /> {t('admin.inventory')}
                        </TabsTrigger>
                        <TabsTrigger value="confirmations" className="data-[state=active]:bg-red-600 data-[state=active]:text-white px-6">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> {t('admin.confirmations')}
                        </TabsTrigger>
                        {isSystemAdmin && (
                            <TabsTrigger value="users" className="data-[state=active]:bg-red-600 data-[state=active]:text-white px-6">
                                <Users className="w-4 h-4 mr-2" /> {t('admin.adminManagement')}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="dashboard">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.totalPersonnel')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{stats?.total_personnel_with_assets || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-red-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.totalItems')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{stats?.total_assigned_items || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-green-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.returnedItems')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{stats?.total_returned_items || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-orange-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-gray-500">{t('admin.stats.pending')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-orange-600">{stats?.pending_confirmations || 0}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

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
                                            <h3 className="font-bold text-lg">Ürün Listesi</h3>
                                            <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="border-red-600 text-red-600">
                                                <PlusCircle className="w-4 h-4 mr-2" /> Satır Ekle
                                            </Button>
                                        </div>

                                        {items.map((item, index) => (
                                            <div key={index} className="flex gap-4 items-end bg-white p-4 border rounded shadow-sm relative group">
                                                <div className="flex-[2]">
                                                    <label className="block text-xs font-medium mb-1">{t('admin.itemName')}</label>
                                                    <Input
                                                        value={item.itemName}
                                                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
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

                                    <Button type="submit" className="w-full bg-red-600 py-6 text-lg">{t('admin.submit')}</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="inventory">
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle>{t('admin.inventory')}</CardTitle>
                                <CardDescription>Tüm zimmetli ve iade edilmiş ürünlerin listesi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-gray-50 text-left">
                                                <th className="p-4">{t('admin.personnelId')}</th>
                                                <th className="p-4">{t('admin.personnelName')}</th>
                                                <th className="p-4">{t('admin.itemName')}</th>
                                                <th className="p-4 font-normal text-gray-500">S/N</th>
                                                <th className="p-4">{t('admin.status')}</th>
                                                <th className="p-4">Tarih</th>
                                                <th className="p-4">{t('admin.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventory.map((item) => (
                                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-4 font-mono">{item.personnel_id}</td>
                                                    <td className="p-4 font-medium">{item.personnel_name}</td>
                                                    <td className="p-4">{item.item_name}</td>
                                                    <td className="p-4 text-gray-500">{item.serial_number}</td>
                                                    <td className="p-4">
                                                        <Badge className={item.status === 'assigned' ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-green-100 text-green-700 hover:bg-green-100"}>
                                                            {item.status === 'assigned' ? 'ZİMMETLİ' : 'İADE EDİLDİ'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-xs text-gray-500">
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="p-4">
                                                        {item.status === 'assigned' && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleReturnAsset(item.id)} className="text-green-600">
                                                                <ArrowLeftRight className="w-4 h-4 mr-2" /> {t('admin.returnButton')}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
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
                                                        {conf.status === 'confirmed' ? 'ONAYLANDI' : 'SIFIRLANDI'}
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
                                                {conf.status === 'confirmed' && (
                                                    <Button
                                                        onClick={() => resetConfirmation(conf.personnel_id)}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white"
                                                    >
                                                        <RefreshCcw className="w-4 h-4 mr-2" /> Onayı Sıfırla (Reset)
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <Card className="md:col-span-1 border-2">
                                    <CardHeader>
                                        <CardTitle>Yeni Yönetici Ekle</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleAddAdmin} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Kullanıcı Adı</label>
                                                <Input
                                                    value={newAdmin.username}
                                                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Şifre</label>
                                                <Input
                                                    type="password"
                                                    value={newAdmin.password}
                                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Rol</label>
                                                <select
                                                    className="w-full p-2 border rounded"
                                                    value={newAdmin.role}
                                                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="system_admin">Sistem Yöneticisi</option>
                                                </select>
                                            </div>
                                            <Button type="submit" className="w-full bg-red-600">Ekle</Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card className="md:col-span-2 border-2">
                                    <CardHeader>
                                        <CardTitle>Yöneticiler</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="p-4">Kullanıcı Adı</th>
                                                    <th className="p-4">Rol</th>
                                                    <th className="p-4">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {admins.map((adm) => (
                                                    <tr key={adm.id} className="border-b">
                                                        <td className="p-4 font-bold">{adm.username}</td>
                                                        <td className="p-4">
                                                            <Badge variant="outline">{adm.role === 'system_admin' ? 'Sistem Yöneticisi' : 'Admin'}</Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            {adm.username !== 'admin' && (
                                                                <Button variant="ghost" size="sm" onClick={() => deleteAdmin(adm.username)} className="text-red-600">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
};

export default AdminDashboard;
