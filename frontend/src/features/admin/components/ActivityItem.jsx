import React from 'react';
import { Activity, User, Check, UserPlus } from 'lucide-react';

export const ActivityItem = ({ log }) => {
    const getActionIcon = (action) => {
        switch (action) {
            case 'Login':
                return <User size={14} className="text-primary" />;
            case 'Approve':
                return <Check size={14} className="text-success" />;
            case 'Assign':
                return <UserPlus size={14} className="text-info" />;
            default:
                return <Activity size={14} className="text-muted" />;
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="list-group-item border-0 py-3 px-3">
            <div className="d-flex gap-3">
                <div className="flex-shrink-0 mt-1">
                    {getActionIcon(log.action)}
                </div>
                <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <span className="fw-semibold small text-truncate">{log.userName}</span>
                        <span
                            className="text-muted"
                            style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                        >
                            {formatTimeAgo(log.createdAt)}
                        </span>
                    </div>
                    <p className="mb-0 small text-muted">
                        <span className="fw-medium text-dark">{log.action}</span>
                        {log.targetType && ` on ${log.targetType}`}
                        {log.targetId && ` #${log.targetId}`}
                    </p>
                </div>
            </div>
        </div>
    );
};
