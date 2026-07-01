import axios from 'axios';

const isBrowserLocalhost = () => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
};

const resolveBaseURL = () => {
    const envUrl = process.env.REACT_APP_API_URL?.replace(/\/$/, '');

    // Vercel'de yanlışlıkla localhost tanımlı olsa bile yok say
    const envPointsToLocal =
        envUrl &&
        (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'));

    if (envUrl && !envPointsToLocal) {
        return envUrl;
    }

    // Canlı site (vercel.app vb.): API aynı domainde /api/*
    if (!isBrowserLocalhost()) {
        return '';
    }

    // Yerel geliştirme
    return envUrl || 'http://localhost:8000';
};

const api = axios.create({
    baseURL: resolveBaseURL(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
