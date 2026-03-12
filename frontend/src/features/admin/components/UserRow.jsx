import React from 'react';
import { Calendar } from 'lucide-react';
import { Avatar } from './Avatar';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { UserActions } from './UserActions';

export const UserRow = ({ user, onEdit, onDelete }) => {
    return (
        <tr key={user.id} className="group">
            <td className="ps-4 py-3 border">
                <div className="d-flex align-items-center gap-3">
                    <Avatar
                        name={user.name}
                        email={user.email}
                        size={40}
                        isActive={user.active}
                    />
                    <div>
                        <div className="fw-semibold text-dark mb-0">{user.name}</div>
                        <div className="small text-muted">{user.email}</div>
                    </div>
                </div>
            </td>
            <td className="border">
                <RoleBadge role={user.role} />
            </td>
            <td className="border">
                <StatusBadge status={user.status} />
            </td>
            <td className="text-muted small border">
                <div className="d-flex align-items-center gap-2">
                    <Calendar size={14} />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
            </td>
            <td className="text-end pe-4 border">
                <UserActions user={user} onEdit={onEdit} onDelete={onDelete} />
            </td>
        </tr>
    );
};
