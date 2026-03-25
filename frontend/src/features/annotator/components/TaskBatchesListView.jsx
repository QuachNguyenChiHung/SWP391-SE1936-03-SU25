import { Layers, RefreshCcw } from 'lucide-react';
import { useUI } from '../../../shared/context/UIContext.jsx';
import { useState, useMemo } from 'react';
import TaskStatusFilter from './TaskStatusFilter';
import TaskTable from './TaskTable';



export const TaskBatchesListView = ({
    isLoadingBatches,
    taskBatches,
    filteredTaskBatches,
    paginatedTaskBatches,
    safeCurrentPage,
    totalPages,
    pageNumbers,
    searchKeyword,
    statusFilter,
    onSearchKeywordChange,
    onStatusFilterChange,
    onPageChange,
    onPreviousPage,
    onNextPage,
    onSelectBatch,
    onDeleteTask,
    projectMetaById
}) => {
    const { language } = useUI();
    const [activeFilter, setActiveFilter] = useState('All');

    const copy = {
        en: {
            title: 'My Tasks',
            subtitle: 'View and manage your assigned annotation tasks',
            loading: 'Loading...',
            noAssigned: 'No Tasks Assigned',
            noAssignedDesc: "You currently don't have any tasks assigned. Check back later or contact your manager.",
            noMatching: 'No matching tasks',
            noMatchingDesc: 'Try another status filter.',
            refresh: 'Refresh'
        },
        vi: {
            title: 'Nhiem vu cua toi',
            subtitle: 'Xem va quan ly cac nhiem vu gan nhan duoc giao',
            loading: 'Dang tai...',
            noAssigned: 'Chua co nhiem vu duoc giao',
            noAssignedDesc: 'Hien tai ban chua co nhiem vu nao duoc giao. Vui long quay lai sau hoac lien he quan ly.',
            noMatching: 'Khong co nhiem vu phu hop',
            noMatchingDesc: 'Thu bo loc trang thai khac.',
            refresh: 'Lam moi'
        }
    };
    const t = copy[language] || copy.en;

    // Enrich tasks with rejected item counts and deadline from projectMetaById
    const enrichedTasks = useMemo(() => {
        return taskBatches.map(task => ({
            ...task,
            rejectedItems: 0, // Will be calculated if needed
            progressPercent: task.progressPercent || Math.round((task.completedItems / task.totalItems) * 100) || 0,
            deadline: projectMetaById?.[task.projectId]?.deadline || task.deadline
        }));
    }, [taskBatches, projectMetaById]);

    // Filter tasks by status
    const filteredTasks = useMemo(() => {
        if (activeFilter === 'All') return enrichedTasks;
        return enrichedTasks.filter(task => task.status === activeFilter);
    }, [enrichedTasks, activeFilter]);

    // Calculate task counts for filter badges
    const taskCounts = useMemo(() => {
        return {
            all: enrichedTasks.length,
            assigned: enrichedTasks.filter(t => t.status === 'Assigned').length,
            inProgress: enrichedTasks.filter(t => t.status === 'InProgress').length,
            submitted: enrichedTasks.filter(t => t.status === 'Submitted').length,
            completed: enrichedTasks.filter(t => t.status === 'Completed').length,
            overdue: enrichedTasks.filter(t => t.status === 'Overdue').length,
        };
    }, [enrichedTasks]);

    // Handle task selection
    const handleTaskClick = (task) => {
        onSelectBatch(task);
    };

    return (
        <div className="container-fluid py-4 animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="h4 fw-bold mb-1">{t.title}</h2>
                    <p className="text-muted small mb-0">{t.subtitle}</p>
                </div>
            </div>

            {isLoadingBatches ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t.loading}</span>
                        </div>
                        <p className="text-muted mt-3">{t.loading}</p>
                    </div>
                </div>
            ) : taskBatches.length === 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <div className="mb-3">
                            <Layers size={48} className="text-muted" />
                        </div>
                        <h3 className="h5 fw-medium text-slate-900">{t.noAssigned}</h3>
                        <p className="text-muted mx-auto mt-2" style={{ maxWidth: '28rem' }}>{t.noAssignedDesc}</p>
                    </div>
                </div>
            ) : (
                <>
                    <TaskStatusFilter
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                        taskCounts={taskCounts}
                    />

                    {filteredTasks.length === 0 ? (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <div className="mb-3">
                                    <Layers size={48} className="text-muted" />
                                </div>
                                <h3 className="h5 fw-medium text-slate-900">{t.noMatching}</h3>
                                <p className="text-muted mx-auto mt-2" style={{ maxWidth: '28rem' }}>
                                    {t.noMatchingDesc}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <TaskTable 
                            tasks={filteredTasks} 
                            loading={false}
                            onTaskClick={handleTaskClick}
                        />
                    )}
                </>
            )}
        </div>
    );
};
