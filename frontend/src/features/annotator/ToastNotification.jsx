import React from 'react';
import { useUI } from '../../shared/context/UIContext.jsx';

export const ToastNotification = ({ toast, onClose }) => {
    const { language } = useUI();
    const copy = {
        en: {
            success: '✓ Success',
            error: '✗ Error',
            warning: '⚠ Warning',
            close: 'Close'
        },
        vi: {
            success: '✓ Thanh cong',
            error: '✗ Loi',
            warning: '⚠ Canh bao',
            close: 'Dong'
        }
    };
    const t = copy[language] || copy.en;

    return (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className={`toast ${toast.show ? 'show' : ''}`} role="alert" aria-live="assertive" aria-atomic="true">
                <div className={`toast-header ${toast.type === 'success' ? 'bg-success' : toast.type === 'error' ? 'bg-danger' : 'bg-warning'} text-white`}>
                    <strong className="me-auto">
                        {toast.type === 'success' ? t.success : toast.type === 'error' ? t.error : t.warning}
                    </strong>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={onClose}
                        aria-label={t.close}
                    ></button>
                </div>
                <div className="toast-body">
                    {toast.message}
                </div>
            </div>
        </div>
    );
};
