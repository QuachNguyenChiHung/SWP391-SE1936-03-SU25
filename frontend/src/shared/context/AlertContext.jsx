import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [modalConfig, setModalConfig] = useState({
        show: false,
        title: 'Notification',
        message: '',
        alertType: 'info',
        resolver: null,
    });

    const closeAlert = useCallback(() => {
        setModalConfig((prev) => {
            if (prev.resolver) prev.resolver();
            return { ...prev, show: false, resolver: null };
        });
    }, []);

    const showAlert = useCallback((message, title = 'Notification', alertType = 'info') => {
        return new Promise((resolve) => {
            setModalConfig({
                show: true,
                title,
                message,
                alertType,
                resolver: resolve,
            });
        });
    }, []);

    const value = useMemo(() => ({ modalConfig, showAlert, closeAlert }), [modalConfig, showAlert, closeAlert]);

    return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within AlertProvider');
    }
    return context;
}
