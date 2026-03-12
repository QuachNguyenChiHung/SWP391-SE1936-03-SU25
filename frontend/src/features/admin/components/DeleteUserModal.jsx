import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from 'react-bootstrap';
import api from '../../../shared/utils/api.js';

export const DeleteUserModal = ({ show, user, onHide, onConfirm }) => {
    const handleDelete = () => {
        if (!user) return;

        // Delegate deletion to parent to avoid duplicate API calls.
        if (onConfirm) onConfirm();
    };

    if (!user) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-bottom-0">
                <Modal.Title className="fw-bold h5 text-danger d-flex align-items-center gap-2">
                    <AlertTriangle size={24} /> Delete User
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
                <p className="mb-3">Are you sure you want to delete this user? This action cannot be undone.</p>
                <div className="d-flex align-items-center gap-3 p-3 bg-danger-subtle rounded border border-danger-subtle">
                    <img
                        src={user.avatarUrl}
                        className="rounded-circle bg-white"
                        width="48"
                        height="48"
                        alt={`${user.name}'s avatar`}
                    />
                    <div>
                        <div className="fw-bold text-danger-emphasis">{user.name}</div>
                        <div className="small text-danger-emphasis opacity-75">{user.email}</div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-top-0">
                <Button variant="light" onClick={onHide}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete}>Delete User</Button>
            </Modal.Footer>
        </Modal>
    );
};
