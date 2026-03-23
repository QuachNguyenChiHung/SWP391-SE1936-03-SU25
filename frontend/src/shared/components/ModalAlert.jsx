import React from 'react';
import './modal-popups.css';

const headerClassByType = {
    success: 'nl-alert-header-success',
    error: 'nl-alert-header-error',
    warning: 'nl-alert-header-warning',
    info: 'nl-alert-header-info',
};

export default function ModalAlert({
    show,
    title = 'Notification',
    message = '',
    alertType = 'info',
    onClose,
}) {
    if (!show) return null;

    return (
        <div
            className="modal fade show d-block nl-modal-overlay"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div className="modal-dialog modal-dialog-centered nl-modal-dialog" role="document">
                <div className="modal-content nl-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className={`modal-header nl-modal-header ${headerClassByType[alertType] || headerClassByType.info}`}>
                        <h5 className="modal-title">{title}</h5>
                        <button
                            type="button"
                            className={`btn-close ${alertType !== 'warning' ? 'btn-close-white' : ''}`}
                            aria-label="Close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body nl-modal-body">
                        <p className="mb-0">{message}</p>
                    </div>
                    <div className="modal-footer nl-modal-footer">
                        <button type="button" className="btn btn-primary" onClick={onClose}>
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
