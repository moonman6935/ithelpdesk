import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
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
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.detail || 'Giriş başarısız');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full border-2">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Lock className="text-red-600" />
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
                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg">
                            {t('admin.loginButton')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
