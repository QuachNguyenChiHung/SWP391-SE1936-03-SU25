import React, { useState, useEffect } from 'react';
import { User, Mail } from 'lucide-react';
import { Modal, Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import api from '../../../shared/utils/api.js';
import { UserRole } from '../../../shared/types/types.js';

export const EditUserModal = ({ show, user, onHide, onSuccess }) => {
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        if (user) {
            setEditingUser({
                ...user,
                status: user.status || 'Active'
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        const roleMap = {
            'Admin': 1,
            'Manager': 2,
            'Annotator': 3,
            'Reviewer': 4
        };

        const statusMap = {
            'Active': 1,
            'Inactive': 2,
            'PendingVerification': 3,
            'PendingApproval': 4
        };

        const payload = {
            name: editingUser.name,
            role: roleMap[editingUser.role] || 3,
            status: statusMap[editingUser.status] || 1
        };

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await api.put(`/Users/${editingUser.id}`, payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            onHide();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to update user', err);
            alert('Failed to update user: ' + (err?.response?.data?.message || err.message));
        }
    };

    if (!editingUser) return null;

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
                <div>
                    <Modal.Title className="fw-bold h5">Edit User Profile</Modal.Title>
                    <p className="text-muted small mb-0">Update personal details and permissions.</p>
                </div>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <div className="row g-4">
                        {/* Avatar Header */}
                        <div className="col-12 d-flex align-items-center gap-3 p-3 bg-light rounded-3 border border-black">
                            <img
                                src={editingUser.avatarUrl}
                                className="rounded-circle bg-white shadow-sm"
                                width="64"
                                height="64"
                                alt={`${editingUser.name}'s avatar`}
                            />
                            <div>
                                <div className="fw-bold fs-5">{editingUser.name}</div>
                                <div className="text-muted small">{editingUser.email}</div>
                            </div>
                        </div>

                        <Col md={6}>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Full Name</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0 text-muted">
                                    <User size={16} />
                                </InputGroup.Text>
                                <Form.Control
                                    className="border-start-0 ps-0 shadow-none"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    required
                                />
                            </InputGroup>
                        </Col>

                        <Col md={6}>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Email</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0 text-muted">
                                    <Mail size={16} />
                                </InputGroup.Text>
                                <Form.Control
                                    className="border-start-0 ps-0 bg-light shadow-none"
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    required
                                />
                            </InputGroup>
                        </Col>

                        <Col md={6}>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Role</Form.Label>
                            <Form.Select
                                className="shadow-none cursor-pointer"
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col md={6}>
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-1">Account Status</Form.Label>
                            <Form.Select
                                className="shadow-none cursor-pointer"
                                value={editingUser.status}
                                onChange={(e) => setEditingUser({
                                    ...editingUser,
                                    status: e.target.value,
                                    active: e.target.value === 'Active'
                                })}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="PendingVerification">Pending Verification</option>
                                <option value="PendingApproval">Pending Approval</option>
                            </Form.Select>
                        </Col>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border px-4 pb-4 pt-0">
                    <Button variant="light" onClick={onHide} className="px-4">Cancel</Button>
                    <Button variant="primary" type="submit" className="px-4">Save Changes</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
