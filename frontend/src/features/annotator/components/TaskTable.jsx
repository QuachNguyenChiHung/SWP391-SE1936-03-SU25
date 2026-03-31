import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpDown } from 'lucide-react';
import { formatDateTime } from '../../../shared/utils/dateUtils.js';

const TaskTable = ({ tasks, loading, onTaskClick }) => {
    const navigate = useNavigate();
    const [sortConfig, setSortConfig] = useState({ key: 'deadline', direction: 'asc' });

    const getStatusBadgeClass = (status) => {
        const classes = {
            Assigned: 'bg-secondary',
            InProgress: 'bg-primary',
            Submitted: 'bg-warning text-dark',
            Completed: 'bg-success',
            Overdue: 'bg-danger',
        };
        return classes[status] || 'bg-secondary';
    };

    const getPriorityBadgeClass = (priority) => {
        const classes = {
            High: 'bg-danger',
            Medium: 'bg-warning text-dark',
            Low: 'bg-info',
        };
        return classes[priority] || 'bg-secondary';
    };

    const getDeadlineClass = (deadline) => {
        if (!deadline) return 'text-muted';
        const date = new Date(deadline);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'text-danger fw-bold';
        if (diffDays <= 3) return 'text-warning fw-bold';
        return 'text-muted';
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedTasks = React.useMemo(() => {
        const sorted = [...tasks];
        sorted.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'deadline') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [tasks, sortConfig]);

    const handleTaskClick = (task) => {
        if (onTaskClick) {
            onTaskClick(task);
        } else {
            navigate(`/annotator/workspace/${task.id}`);
        }
    };

    const getActionButton = (task) => {
        if (task.status === 'Completed') {
            return (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleTaskClick(task)}>
                    View
                </button>
            );
        }
        if (task.status === 'Submitted') {
            return (
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleTaskClick(task)}>
                    View
                </button>
            );
        }
        if (task.status === 'Assigned') {
            return (
                <button className="btn btn-sm btn-primary" onClick={() => handleTaskClick(task)}>
                    Start
                </button>
            );
        }
        // InProgress
        return (
            <button className="btn btn-sm btn-primary" onClick={() => handleTaskClick(task)}>
                {task.rejectedItems > 0 ? 'Rework' : 'Continue'}
            </button>
        );
    };

    if (loading) {
        return (
            <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-3">Loading tasks...</p>
                </div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                    <p className="text-muted mb-0">No tasks found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="border-bottom-0 text-muted small text-uppercase">
                                <button
                                    className="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center gap-1"
                                    onClick={() => handleSort('id')}
                                >
                                    Task ID <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="border-bottom-0 text-muted small text-uppercase">Project</th>
                            <th className="border-bottom-0 text-muted small text-uppercase text-center">Items</th>
                            <th className="border-bottom-0 text-muted small text-uppercase text-center">Progress</th>
                            <th className="border-bottom-0 text-muted small text-uppercase">Status</th>
                            <th className="border-bottom-0 text-muted small text-uppercase">
                                <button
                                    className="btn btn-link p-0 text-decoration-none text-muted d-flex align-items-center gap-1"
                                    onClick={() => handleSort('deadline')}
                                >
                                    Deadline <ArrowUpDown size={14} />
                                </button>
                            </th>
                            <th className="border-bottom-0 text-muted small text-uppercase">Priority</th>
                            <th className="border-bottom-0 text-muted small text-uppercase text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map((task) => (
                            <tr
                                key={task.id}
                                className={task.rejectedItems > 0 ? 'table-danger bg-opacity-10' : ''}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleTaskClick(task)}
                            >
                                <td className="fw-bold">#{task.id}</td>
                                <td>
                                    <div className="fw-medium">{task.projectName}</div>
                                    {task.rejectedItems > 0 && (
                                        <small className="text-danger d-flex align-items-center gap-1">
                                            <AlertCircle size={14} />
                                            {task.rejectedItems} item{task.rejectedItems > 1 ? 's' : ''} need rework
                                        </small>
                                    )}
                                </td>
                                <td className="text-center">
                                    <div>{task.completedItems} / {task.totalItems}</div>
                                    {task.rejectedItems > 0 && (
                                        <small className="text-danger">({task.rejectedItems} rejected)</small>
                                    )}
                                </td>
                                <td className="text-center">
                                    <div className="d-flex flex-column align-items-center">
                                        <div className="progress" style={{ width: '80px', height: '8px' }}>
                                            <div
                                                className={`progress-bar ${task.rejectedItems > 0 ? 'bg-danger' : 'bg-primary'}`}
                                                style={{ width: `${task.progressPercent || 0}%` }}
                                            />
                                        </div>
                                        <small className="text-muted mt-1">{task.progressPercent || 0}%</small>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className={getDeadlineClass(task.deadline)}>
                                    {formatDateTime(task.deadline)}
                                </td>
                                <td>
                                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                        {task.priority || 'Medium'}
                                    </span>
                                </td>
                                <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                    {getActionButton(task)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

TaskTable.propTypes = {
    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            projectName: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
            totalItems: PropTypes.number.isRequired,
            completedItems: PropTypes.number.isRequired,
            rejectedItems: PropTypes.number,
            progressPercent: PropTypes.number,
            deadline: PropTypes.string,
            priority: PropTypes.string,
        })
    ).isRequired,
    loading: PropTypes.bool,
    onTaskClick: PropTypes.func,
};

export default TaskTable;
