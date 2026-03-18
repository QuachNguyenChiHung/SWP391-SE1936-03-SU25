import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);

const LANGUAGE_KEY = 'ui_language';
const THEME_KEY = 'ui_theme';

const getInitialLanguage = () => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved === 'vi' || saved === 'en' ? saved : 'en';
};

const getInitialTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
        return saved;
    }

    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
};

export const UIProvider = ({ children }) => {
    const [language, setLanguage] = useState(getInitialLanguage);
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        localStorage.setItem(LANGUAGE_KEY, language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem(THEME_KEY, theme);
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        toggleLanguage: () => setLanguage((prev) => (prev === 'en' ? 'vi' : 'en')),
        theme,
        setTheme,
        toggleTheme: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
    }), [language, theme]);

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const ctx = useContext(UIContext);
    if (!ctx) {
        throw new Error('useUI must be used within UIProvider');
    }
    return ctx;
};
