import React from 'react';
import { Activity } from 'lucide-react';
import { Button, Spinner } from 'react-bootstrap';
import { ActivityItem } from './ActivityItem';

export const ActivityFeed = ({ activities = [], isLoading, onRefresh }) => {
    return (
        <div className="card border shadow-sm h-100">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <Activity size={18} className="text-primary" /> Recent Activity
                </h6>
                <Button
                    variant="link"
                    size="sm"
                    className="text-muted p-0 text-decoration-none"
                    onClick={onRefresh}
                    aria-label="Refresh activity"
                >
                    Refresh
                </Button>
            </div>
            <div className="card-body p-0">
                {isLoading ? (
                    <div className="text-center text-muted py-4">
                        <Spinner animation="border" size="sm" className="mb-2" />
                        <p className="mb-0 small">Loading activity...</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <Activity size={32} className="mb-2 opacity-50" />
                        <p className="mb-0">No activity logs available</p>
                    </div>
                ) : (
                    <div className="list-group list-group-flush">
                        {activities.map((log) => (
                            <ActivityItem key={log.id} log={log} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
