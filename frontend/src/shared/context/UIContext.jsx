import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);

const LANGUAGE_KEY = 'ui_language';
const getInitialLanguage = () => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved === 'vi' || saved === 'en' ? saved : 'en';
};

export const UIProvider = ({ children }) => {
    const [language, setLanguage] = useState(getInitialLanguage);
    const theme = 'light';

    useEffect(() => {
        localStorage.setItem(LANGUAGE_KEY, language);
    }, [language]);

    useEffect(() => {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        localStorage.removeItem('ui_theme');
    }, []);

    const value = useMemo(() => ({
        language,
        setLanguage,
        toggleLanguage: () => setLanguage((prev) => (prev === 'en' ? 'vi' : 'en')),
        theme,
        setTheme: () => { },
        toggleTheme: () => { },
    }), [language]);

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const ctx = useContext(UIContext);
    if (!ctx) {
        throw new Error('useUI must be used within UIProvider');
    }
    return ctx;
};
