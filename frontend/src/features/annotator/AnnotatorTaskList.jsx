import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/utils/api.js';
import TaskStatusFilter from './components/TaskStatusFilter';
import TaskTable from './components/TaskTable';
import { RefreshCcw } from 'lucide-react';

export const AnnotatorTaskList = ({ user }) => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Tasks', {
                params: { annotatorId: user?.id }
            });
            const taskList = res.data?.data || res.data || [];
            
            // Enrich tasks with rejected item counts
            const enrichedTasks = await Promise.all(
                taskList.map(async (task) => {
                    try {
                        // Fetch task items to count rejected
                        const itemsRes = await api.get(`/Tasks/${task.id}`);
                        const taskDetail = itemsRes.data?.data || itemsRes.data;
                        const items = taskDetail.items || [];
                        
                        const rejectedCount = items.filter(item => item.status === 'Rejected').length;
                        
                        return {
                            ...task,
                            rejectedItems: rejectedCount,
                            progressPercent: task.progressPercent || Math.round((task.completedItems / task.totalItems) * 100) || 0
                        };
                    } catch (err) {
                        console.error(`Failed to fetch items for task ${task.id}`, err);
                        return {
                            ...task,
                            rejectedItems: 0,
                            progressPercent: task.progressPercent || Math.round((task.completedItems / task.totalItems) * 100) || 0
                        };
                    }
                })
            );
            
            setTasks(enrichedTasks);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchTasks();
        }
    }, [user?.id]);

    const filteredTasks = useMemo(() => {
        if (activeFilter === 'All') return tasks;
        return tasks.filter(task => task.status === activeFilter);
    }, [tasks, activeFilter]);

    const taskCounts = useMemo(() => {
        return {
            all: tasks.length,
            assigned: tasks.filter(t => t.status === 'Assigned').length,
            inProgress: tasks.filter(t => t.status === 'InProgress').length,
            submitted: tasks.filter(t => t.status === 'Submitted').length,
            completed: tasks.filter(t => t.status === 'Completed').length,
        };
    }, [tasks]);

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="h4 fw-bold mb-1">My Tasks</h2>
                    <p className="text-muted small mb-0">View and manage your assigned annotation tasks</p>
                </div>
                <button
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={fetchTasks}
                    disabled={loading}
                >
                    <RefreshCcw size={16} className={loading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            <TaskStatusFilter
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                taskCounts={taskCounts}
            />

            <TaskTable tasks={filteredTasks} loading={loading} />

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AnnotatorTaskList;
