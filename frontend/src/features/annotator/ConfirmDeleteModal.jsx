import React from 'react';
import { useUI } from '../../shared/context/UIContext.jsx';

export const ConfirmDeleteModal = ({ show, onConfirm, onCancel }) => {
    const { language } = useUI();
    const copy = {
        en: {
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this annotation?',
            warning: 'This action cannot be undone.',
            cancel: 'Cancel',
            delete: 'Delete'
        },
        vi: {
            title: 'Xac nhan xoa',
            message: 'Ban co chac muon xoa annotation nay khong?',
            warning: 'Hanh dong nay khong the hoan tac.',
            cancel: 'Huy',
            delete: 'Xoa'
        }
    };
    const t = copy[language] || copy.en;

    if (!show) return null;

    return (
        <div className="modal show d-block nl-modal-overlay" tabIndex="-1" onClick={onCancel}>
            <div className="modal-dialog modal-dialog-centered nl-modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content nl-modal-content">
                    <div className="modal-header nl-modal-header nl-confirm-header-danger">
                        <h5 className="modal-title fw-bold">{t.title}</h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onCancel}
                        ></button>
                    </div>
                    <div className="modal-body nl-modal-body">
                        <p className="mb-0">{t.message}</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>{t.warning}</p>
                    </div>
                    <div className="modal-footer nl-modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={onConfirm}
                        >
                            {t.delete}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
