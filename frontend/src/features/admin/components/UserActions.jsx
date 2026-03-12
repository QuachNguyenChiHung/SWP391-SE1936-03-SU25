import React from 'react';
import { Trash2 } from 'lucide-react';

export const UserActions = ({ user, onEdit, onDelete }) => {
    return (
        <div className="d-flex justify-content-end gap-2">
            <button
                className="btn btn-warning fw-medium px-3 py-1 rounded"
                style={{ fontSize: '0.85rem' }}
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(user);
                }}
                aria-label={`Edit ${user.name}`}
            >
                Edit
            </button>

            <button
                className="btn btn-danger p-1 rounded d-flex align-items-center justify-content-center"
                style={{
                    color: 'white',
                    width: '34px',
                    height: '34px'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(user);
                }}
                title={`Delete ${user.name}`}
                aria-label={`Delete ${user.name}`}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};
