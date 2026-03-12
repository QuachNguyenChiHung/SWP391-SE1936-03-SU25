import React from 'react';
import { Spinner } from 'react-bootstrap';
import { UserRow } from './UserRow';

export const UserTable = ({
    users,
    isLoading,
    onEdit,
    onDelete
}) => {
    return (
        <div className="table-responsive p-3">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-primary">
                    <tr>
                        <th className="ps-4 py-3 text-muted small text-uppercase fw-bold border">User Profile</th>
                        <th className="py-3 text-muted small text-uppercase fw-bold border">Role</th>
                        <th className="py-3 text-muted small text-uppercase fw-bold border">Status</th>
                        <th className="py-3 text-muted small text-uppercase fw-bold border">Joined</th>
                        <th className="pe-4 py-3 text-end text-muted small text-uppercase fw-bold border">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan="5" className="text-center py-5">
                                <Spinner animation="border" variant="primary" size="sm" /> Loading users...
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="text-center py-5 text-muted">
                                No users found matching your search.
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <UserRow
                                key={user.id}
                                user={user}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
