import React, { useState } from 'react';
import { UserPlus, Mail, Shield, UserIcon } from 'lucide-react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import api from '../../../shared/utils/api.js';
import { UserRole } from '../../../shared/types/types.js';

export const CreateUserModal = ({ show, onHide, onSuccess, onError }) => {
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        email: '',
        role: UserRole.ANNOTATOR
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const roleMap = {
            'Admin': 1,
            'Manager': 2,
            'Annotator': 3,
            'Reviewer': 4
        };

        const payload = {
            email: newUser.email,
            password: newUser.password,
            name: newUser.username,
            role: roleMap[newUser.role] || 3
        };

        try {
            const token = JSON.parse(localStorage.getItem('user'))?.token;
            await api.post('/Users', payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            setNewUser({ username: '', password: '', email: '', role: UserRole.ANNOTATOR });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to create user', err);

            let errorMessage = 'Unknown error';
            if (err?.response?.data) {
                const data = err.response.data;
                if (data.message) {
                    errorMessage = data.message;
                } else if (data.errors) {
                    if (Array.isArray(data.errors)) {
                        errorMessage = data.errors.join(', ');
                    } else if (typeof data.errors === 'object') {
                        errorMessage = Object.values(data.errors).flat().join(', ');
                    } else {
                        errorMessage = String(data.errors);
                    }
                } else if (typeof data === 'string') {
                    errorMessage = data;
                } else {
                    errorMessage = JSON.stringify(data);
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            const fullErrorMessage = 'Failed to create user: ' + errorMessage;
            setError(fullErrorMessage);
            if (onError) onError(fullErrorMessage);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title className="fw-bold h5">Create New User</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="d-flex flex-column gap-3 pt-3">
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">USERNAME</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light border-end-0">
                                <UserIcon size={16} />
                            </InputGroup.Text>
                            <Form.Control
                                className="border-start-0 ps-0 bg-light shadow-none"
                                placeholder="Enter username"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                required
                            />
                        </InputGroup>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">EMAIL</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light border-end-0">
                                <Mail size={16} />
                            </InputGroup.Text>
                            <Form.Control
                                type="email"
                                className="border-start-0 ps-0 bg-light shadow-none"
                                placeholder="Enter email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                required
                            />
                        </InputGroup>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">PASSWORD</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light border-end-0">
                                <Shield size={16} />
                            </InputGroup.Text>
                            <Form.Control
                                type="password"
                                className="border-start-0 ps-0 bg-light shadow-none"
                                placeholder="Enter password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                required
                            />
                        </InputGroup>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">ROLE</Form.Label>
                        <Form.Select
                            className="bg-light shadow-none cursor-pointer"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            {Object.values(UserRole).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-0">
                    <Button variant="light" onClick={onHide}>Cancel</Button>
                    <Button variant="primary" type="submit" className="d-flex align-items-center gap-2">
                        <UserPlus size={16} /> Create User
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
