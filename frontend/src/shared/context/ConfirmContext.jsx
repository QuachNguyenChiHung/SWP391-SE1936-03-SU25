import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [confirmConfig, setConfirmConfig] = useState({
        show: false,
        title: 'Confirm',
        message: '',
        variant: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        resolver: null,
    });

    const closeConfirm = useCallback((result = false) => {
        setConfirmConfig((prev) => {
            if (prev.resolver) prev.resolver(result);
            return { ...prev, show: false, resolver: null };
        });
    }, []);

    const showConfirm = useCallback(
        (message, title = 'Confirm', variant = 'warning', confirmText = 'Confirm', cancelText = 'Cancel') => {
            return new Promise((resolve) => {
                setConfirmConfig({
                    show: true,
                    title,
                    message,
                    variant,
                    confirmText,
                    cancelText,
                    resolver: resolve,
                });
            });
        },
        []
    );

    const value = useMemo(() => ({ confirmConfig, showConfirm, closeConfirm }), [confirmConfig, showConfirm, closeConfirm]);

    return <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context;
}
