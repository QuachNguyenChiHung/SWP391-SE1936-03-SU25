import React from 'react';

export const ConfirmDeleteModal = ({ show, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div className="modal show d-block nl-modal-overlay" tabIndex="-1" onClick={onCancel}>
            <div className="modal-dialog modal-dialog-centered nl-modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content nl-modal-content">
                    <div className="modal-header nl-modal-header nl-confirm-header-danger">
                        <h5 className="modal-title fw-bold">Confirm Delete</h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onCancel}
                        ></button>
                    </div>
                    <div className="modal-body nl-modal-body">
                        <p className="mb-0">Are you sure you want to delete this annotation?</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>This action cannot be undone.</p>
                    </div>
                    <div className="modal-footer nl-modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={onConfirm}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
