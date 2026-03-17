import React from 'react';
import './modal-popups.css';

const headerClassByVariant = {
    danger: 'nl-confirm-header-danger',
    warning: 'nl-confirm-header-warning',
    success: 'nl-confirm-header-success',
    info: 'nl-confirm-header-info',
};

const confirmButtonByVariant = {
    danger: 'btn btn-danger',
    warning: 'btn btn-warning',
    success: 'btn btn-success',
    info: 'btn btn-info text-white',
};

export default function ConfirmModal({
    show,
    title = 'Confirm',
    message = '',
    variant = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
}) {
    if (!show) return null;

    return (
        <div
            className="modal fade show d-block nl-modal-overlay"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            onClick={onCancel}
        >
            <div className="modal-dialog modal-dialog-centered nl-modal-dialog" role="document">
                <div className="modal-content nl-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className={`modal-header nl-modal-header ${headerClassByVariant[variant] || headerClassByVariant.warning}`}>
                        <h5 className="modal-title">{title}</h5>
                        <button
                            type="button"
                            className={`btn-close ${variant !== 'warning' ? 'btn-close-white' : ''}`}
                            aria-label="Close"
                            onClick={onCancel}
                        ></button>
                    </div>
                    <div className="modal-body nl-modal-body">
                        <p className="mb-0">{message}</p>
                    </div>
                    <div className="modal-footer nl-modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            className={confirmButtonByVariant[variant] || confirmButtonByVariant.warning}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
