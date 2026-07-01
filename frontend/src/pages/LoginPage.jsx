import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Lock } from "lucide-react";
import api from '../lib/api';

const LoginPage = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/login', {
                username,
                password
            });
            localStorage.setItem('admin_token', response.data.access_token);
            localStorage.setItem('admin_role', response.data.role);
            localStorage.setItem('admin_username', username);
            navigate('/admin');
        } catch (err) {
            if (!err.response) {
                setError('API sunucusuna bağlanılamıyor. Vercel ortam değişkenlerinde MONGO_URL tanımlı olduğundan emin olun.');
            } else {
                setError(err.response?.data?.detail || 'Giriş başarısız');
            }
        }
    };

    return (
        <PageShell centered maxWidth="max-w-md" hideHero>
            <Card className="glass-panel border-0 shadow-2xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-red-500 via-violet-500 to-blue-500" />
                <CardHeader className="text-center pt-8">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                        <Lock className="text-white w-7 h-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t('admin.loginTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('admin.username')}</label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('admin.password')}</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        {error && <p className="text-red-600 text-sm text-center font-medium">{error}</p>}
                        <Button type="submit" variant="brand" className="w-full py-6 text-lg">
                            {t('admin.loginButton')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PageShell>
    );
};

export default LoginPage;
