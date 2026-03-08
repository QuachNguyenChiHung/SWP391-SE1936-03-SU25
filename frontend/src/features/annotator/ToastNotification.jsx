import React from 'react';

export const ToastNotification = ({ toast, onClose }) => {
    return (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className={`toast ${toast.show ? 'show' : ''}`} role="alert" aria-live="assertive" aria-atomic="true">
                <div className={`toast-header ${toast.type === 'success' ? 'bg-success' : toast.type === 'error' ? 'bg-danger' : 'bg-warning'} text-white`}>
                    <strong className="me-auto">
                        {toast.type === 'success' ? '✓ Success' : toast.type === 'error' ? '✗ Error' : '⚠ Warning'}
                    </strong>
                    <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={onClose}
                        aria-label="Close"
                    ></button>
                </div>
                <div className="toast-body">
                    {toast.message}
                </div>
            </div>
        </div>
    );
};
