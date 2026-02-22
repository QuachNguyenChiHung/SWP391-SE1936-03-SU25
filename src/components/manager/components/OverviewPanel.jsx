import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';

export default function OverviewPanel({ project, openImportModal, openGuidelines, openEditProject }) {
    if (!project) return null;
    return (
        <div className="row g-4">
            <div className="col-12 col-lg-8">
                <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                            <PieChartIcon size={20} className="text-primary" /> Project Progress
                        </h5>
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
                            <Button variant="light" className="text-start d-flex justify-content-between align-items-center p-3 border bg-white" onClick={openImportModal}>
                                <span className="d-flex align-items-center gap-2">Import Dataset</span>
                            </Button>
                            <Button variant="light" className="text-start d-flex justify-content-between align-items-center p-3 border bg-white" onClick={openGuidelines}>
                                <span className="d-flex align-items-center gap-2">Guidelines</span>
                            </Button>
                            <Button variant="light" className="text-start d-flex justify-content-between align-items-center p-3 border bg-white" onClick={openEditProject}>
                                <span className="d-flex align-items-center gap-2">Edit Project</span>
                            </Button>
                            <hr className="my-2" />
                            <Button variant="outline-danger">Delete Project</Button>
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
