import axios from 'axios'
import getInforFromCookie from './getInfoFromCookie.js';

const api = axios.create({
    baseURL: import.meta.env.VITE_URL
});

// Attach token automatically from cookie or localStorage
api.interceptors.request.use((config) => {
    try {
        const cookieUser = getInforFromCookie();
        let token = cookieUser?.token;
        if (!token) {
            const ls = localStorage.getItem('user');
            try {
                token = ls ? JSON.parse(ls)?.token : null;
            } catch (e) {
                token = null;
            }
        }

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        // ignore
    }
    return config;
}, (error) => Promise.reject(error));

export default api;