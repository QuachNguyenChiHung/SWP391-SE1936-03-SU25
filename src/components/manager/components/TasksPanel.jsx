import React from 'react';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { ChevronUp, ChevronDown, Tag, MoreHorizontal } from 'lucide-react';

export default function TasksPanel({ tasksByAssignee, expandedTaskGroups, toggleGroup, MOCK_USERS, StatusBadge }) {
    return (
        <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <h5 className="fw-bold mb-0">Task Assignments</h5>
                    <small className="text-muted">Track assignments</small>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm">Auto-Assign</Button>
                    <Button variant="primary" size="sm" className="d-flex align-items-center gap-2">Assign</Button>
                </div>
            </div>
            {Object.entries(tasksByAssignee).map(([assigneeId, tasks]) => {
                const assignee = MOCK_USERS.find(u => u.id === assigneeId);
                const isExpanded = expandedTaskGroups[assigneeId] ?? true;
                const completedCount = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'ACCEPTED').length;
                const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

                return (
                    <div key={assigneeId} className="card border-0 shadow-sm overflow-hidden">
                        <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between cursor-pointer border-bottom-0" onClick={() => toggleGroup(assigneeId)}>
                            <div className="d-flex align-items-center gap-3">
                                <Button variant="link" className="p-0 text-muted text-decoration-none" onClick={(e) => { e.stopPropagation(); toggleGroup(assigneeId); }}>
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </Button>
                                <div className="d-flex align-items-center gap-3">
                                    {assignee ? (
                                        <img src={assignee.avatarUrl} alt="" className="rounded-circle border" width="36" height="36" />
                                    ) : <div className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary small fw-bold" style={{ width: 36, height: 36 }}>?</div>}
                                    <div>
                                        <div className="fw-bold mb-0 lh-1 text-dark">{assignee ? assignee.name : "Unassigned"}</div>
                                        <small className="text-muted">{tasks.length} items</small>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4">
                                <div className="d-none d-md-block" style={{ width: '180px' }}>
                                    <div className="d-flex justify-content-between small text-muted mb-1">
                                        <span>Progress</span>
                                        <span className="fw-bold">{progress}%</span>
                                    </div>
                                    <ProgressBar now={progress} style={{ height: '6px' }} variant={progress === 100 ? 'success' : 'primary'} />
                                </div>
                                <span className="badge bg-light text-dark border px-3 py-2">{completedCount} / {tasks.length} Done</span>
                            </div>
                        </div>
                        {isExpanded && <div className="card-body bg-light bg-opacity-50 p-3 border-top">
                            <div className="d-flex flex-column gap-2">
                                {tasks.map(t => (
                                    <div key={t.id} className="bg-white p-2 rounded shadow-sm d-flex justify-content-between align-items-center border-0">
                                        <div className="d-flex gap-3 align-items-center">
                                            <img src={t.imageUrl} width="48" height="36" className="rounded object-fit-cover border" />
                                            <div>
                                                <div className="small fw-bold text-dark">{t.itemName}</div>
                                                <div className="d-flex gap-2 align-items-center text-muted" style={{ fontSize: '11px' }}>
                                                    <span>ID: {t.id}</span>
                                                    <span>•</span>
                                                    <span><Tag size={10} /> {t.annotations.length} Objects</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <StatusBadge status={t.status} />
                                            <Button variant="link" className="text-muted p-0"><MoreHorizontal size={16} /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>}
                    </div>
                )
            })}
        </div>
    );
}
