import { useNavigate } from 'react-router-dom';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../services/mockData.js';
import { DataItemStatus } from '../../types.js';
import { FileStack, CheckCircle2, Target, AlertCircle, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AnnotatorDashboard = ({ user }) => {
    const navigate = useNavigate();
    const myTasks = MOCK_TASKS.filter(t => t.assignedTo === user.id);
    const totalReceived = myTasks.length;

    const finishedTasks = myTasks.filter(t =>
        [DataItemStatus.COMPLETED, DataItemStatus.ACCEPTED, DataItemStatus.REJECTED].includes(t.status)
    );

    const annotatedCount = myTasks.filter(t =>
        t.annotations.length > 0 || [DataItemStatus.COMPLETED, DataItemStatus.ACCEPTED, DataItemStatus.REJECTED].includes(t.status)
    ).length;
    const unAnnotatedCount = totalReceived - annotatedCount;

    const rejectedCount = myTasks.filter(t => t.status === DataItemStatus.REJECTED).length;
    const rejectionRate = finishedTasks.length > 0
        ? Math.round((rejectedCount / finishedTasks.length) * 100)
        : 0;

    const stats = [
        { label: 'Total Received Tasks', value: totalReceived, icon: FileStack, color: 'text-primary', bg: 'bg-blue-light' },
        { label: 'Finished Tasks', value: finishedTasks.length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success-light' },
        { label: 'Pending / Unannotated', value: unAnnotatedCount, icon: Target, color: 'text-warning', bg: 'bg-orange-light' },
        { label: 'Rejection Rate', value: `${rejectionRate}%`, icon: AlertCircle, color: 'text-danger', bg: 'bg-danger-light' },
    ];

    return (
        <div className="h-100 d-flex flex-column gap-4">
            {/* Header / Welcome */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                    <h2 className="h4 fw-bold text-dark">Welcome back, {user.name}</h2>
                    <p className="text-muted">Here is what is happening in your workspace today.</p>
                </div>
                <div className="text-end d-none d-md-block">
                    <p className="small fw-bold text-muted text-uppercase">Current Role</p>
                    <span className="badge bg-primary bg-opacity-10 text-primary">
                        {user.role}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="row g-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="col-12 col-md-6 col-lg-3">
                        <div className="card border shadow-sm h-100">
                            <div className="card-body d-flex align-items-center gap-3">
                                <div className={`p-3 rounded ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="small fw-medium text-muted mb-1">{stat.label}</p>
                                    <p className="h4 fw-bold mb-0">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="h6 fw-semibold mb-0">Your Task Progress</h3>
                            </div>
                            <div style={{ height: '16rem' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={MOCK_PROJECTS}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(value) => value.split(' ')[0]} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="completedItems" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Completed" />
                                        <Bar dataKey="totalItems" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card border shadow-sm h-100">
                        <div className="card-body">
                            <h3 className="h6 fw-semibold mb-4">Recent Activity</h3>
                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex align-items-start gap-3 pb-3 border-bottom">
                                    <div className="mt-1 p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
                                        <Plus size={14} />
                                    </div>
                                    <div>
                                        <p className="small fw-medium mb-1">New Project "Lidar Scan 04" Created</p>
                                        <p className="small text-muted mb-0">2 hours ago by Morgan</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-start gap-3 pb-3 border-bottom">
                                    <div className="mt-1 p-2 bg-success bg-opacity-10 text-success rounded-circle">
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <div>
                                        <p className="small fw-medium mb-1">Batch #203 Completed</p>
                                        <p className="small text-muted mb-0">5 hours ago by Sam</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-start gap-3">
                                    <div className="mt-1 p-2 bg-danger bg-opacity-10 text-danger rounded-circle">
                                        <AlertCircle size={14} />
                                    </div>
                                    <div>
                                        <p className="small fw-medium mb-1">Task Rejection Rate Spiked</p>
                                        <p className="small text-muted mb-0">Yesterday in Project Alpha</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};







