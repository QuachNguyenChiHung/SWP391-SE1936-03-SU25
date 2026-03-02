import React from 'react';

export const ConfirmDeleteModal = ({ show, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">Confirm Delete</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onCancel}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <p className="mb-0">Are you sure you want to delete this annotation?</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>This action cannot be undone.</p>
                    </div>
                    <div className="modal-footer border-0">
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
