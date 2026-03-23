import React from 'react';
import PropTypes from 'prop-types';

const TaskStatusFilter = ({ activeFilter, onFilterChange, taskCounts }) => {
    const filters = [
        { id: 'All', label: 'All Tasks', count: taskCounts.all },
        { id: 'Assigned', label: 'Assigned', count: taskCounts.assigned },
        { id: 'InProgress', label: 'In Progress', count: taskCounts.inProgress },
        { id: 'Submitted', label: 'Submitted', count: taskCounts.submitted },
        { id: 'Completed', label: 'Completed', count: taskCounts.completed },
    ];

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3">
                <div className="d-flex flex-wrap gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            className={`btn ${
                                activeFilter === filter.id
                                    ? 'btn-primary'
                                    : 'btn-outline-secondary'
                            } d-flex align-items-center gap-2`}
                            onClick={() => onFilterChange(filter.id)}
                        >
                            <span>{filter.label}</span>
                            <span
                                className={`badge ${
                                    activeFilter === filter.id
                                        ? 'bg-white text-primary'
                                        : 'bg-secondary'
                                }`}
                            >
                                {filter.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

TaskStatusFilter.propTypes = {
    activeFilter: PropTypes.string.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    taskCounts: PropTypes.shape({
        all: PropTypes.number,
        assigned: PropTypes.number,
        inProgress: PropTypes.number,
        submitted: PropTypes.number,
        completed: PropTypes.number,
    }).isRequired,
};

export default TaskStatusFilter;
