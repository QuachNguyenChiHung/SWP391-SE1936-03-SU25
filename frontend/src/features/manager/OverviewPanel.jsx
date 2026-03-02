import React from 'react';
import { PieChart as PieChartIcon, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { ProjectStatus } from '../../shared/types/types.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';

export default function OverviewPanel({ project, openImportModal, openGuidelines, openEditProject }) {
    if (!project) return null;
    const StatusBadge = ({ status }) => {
        const config = {
            [ProjectStatus.Active]: { bg: '#eff6ff', text: '#1e40af', icon: Clock, label: 'Active' },
            [ProjectStatus.Archived]: { bg: '#f1f5f9', text: '#475569', icon: CheckCircle2, label: 'Archived' },
            [ProjectStatus.Completed]: { bg: '#ecfdf5', text: '#065f46', icon: AlertCircle, label: 'Completed' },
            [ProjectStatus.Draft]: { bg: '#fff7ed', text: '#b45309', icon: XCircle, label: 'Draft' },
        };
        const defaultStyle = { bg: '#f1f5f9', text: '#475569', icon: CheckCircle2, label: status || 'Unknown' };
        const style = config[status] || defaultStyle;
        const Icon = style.icon;
        return (
            <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill border"
                style={{ backgroundColor: style.bg, color: style.text, borderColor: 'transparent', fontSize: '0.75rem', fontWeight: 600 }}>
                <Icon size={12} /> {style.label}

            </span>
        );
    };
    return (
        <div className="row g-4">
            <div className="col-12 col-lg-8">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                <PieChartIcon size={20} className="text-primary" /> Project Progress
                            </h5>
                            <StatusBadge status={project.status} />
                        </div>
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Completed', value: project.completedItems },
                                            { name: 'Remaining', value: project.totalItems - project.completedItems }
                                        ]}
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#4f46e5" />
                                        <Cell fill="#e2e8f0" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="d-flex justify-content-center gap-5 mt-3">
                            <div className="text-center">
                                <h3 className="fw-bold mb-0 text-primary">{project.completedItems}</h3>
                                <small className="text-muted text-uppercase fw-bold">Done</small>
                            </div>
                            <div className="text-center">
                                <h3 className="fw-bold mb-0 text-secondary">{project.totalItems}</h3>
                                <small className="text-muted text-uppercase fw-bold">Total</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-lg-4">
                <div className="card border-0 shadow-sm">
                    <div className="card-body">
                        <h5 className="fw-bold mb-3">Quick Actions</h5>
                        <div className="d-grid gap-2">
                            <Button variant="primary" className="text-start d-flex justify-content-between align-items-center p-3 border text-white" onClick={openImportModal}>
                                <span className="d-flex align-items-center gap-2">Import Dataset</span>
                            </Button>
                            <Button variant="primary" className="text-start d-flex justify-content-between align-items-center p-3 border text-white" onClick={openGuidelines}>
                                <span className="d-flex align-items-center gap-2">Guidelines</span>
                            </Button>
                            <Button variant="warning" className="text-start d-flex justify-content-between align-items-center p-3 border text-white" onClick={openEditProject}>
                                <span className="d-flex align-items-center gap-2">Edit Project</span>
                            </Button>
                            <hr className="my-2" />
                            <Button variant="danger">Delete Project</Button>
                            <p className="mt-2 mb-0">In case of unable to delete an item:</p>
                            <p className="mb-0">1. Item has associated tasks and dataset that must be deleted first.</p>
                            <div>2. There is a server issue. Please contact support.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
