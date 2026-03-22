import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    CircleGauge,
    Clock3,
    FileStack,
    RefreshCcw,
    Target,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import api from '../../shared/utils/api.js';
import { useUI } from '../../shared/context/UIContext.jsx';

const EMPTY_STATS = {
    totalAssigned: 0,
    completed: 0,
    inProgress: 0,
    pendingReview: 0,
};

const formatCompact = (value) => Number(value || 0).toLocaleString();

export const AnnotatorDashboard = ({ user }) => {
    const { language } = useUI();

    const copy = {
        en: {
            loadError: 'Unable to load dashboard data. Please try again.',
            loading: 'Loading annotator dashboard...',
            hello: 'Hello',
            updated: 'Updated',
            liveData: 'Live data from database',
            refresh: 'Refresh',
            productivity: 'Productivity',
            retry: 'Retry',
            completionRate: 'Completion Rate',
            remainingItems: 'Remaining Items',
            activeTasksSnapshot: 'Active Tasks Snapshot',
            totalAssigned: 'Total Assigned',
            completed: 'Completed',
            inProgress: 'In Progress',
            pendingReview: 'Pending Review',
            totalAssignedNote: 'Total tasks assigned to you',
            completedNote: 'completed',
            inProgressNote: 'Tasks currently in progress',
            pendingReviewNote: 'Waiting for reviewer action',
            projectProgress: 'Project Progress',
            projectProgressSub: 'Completion rate by project',
            statusDistribution: 'Status Distribution',
            statusDistributionSub: 'Task distribution by status',
            workloadIntensity: 'Workload Intensity',
            workloadIntensitySub: 'Progress vs remaining items',
            topTasks: 'Top Tasks Overview',
            topTasksSub: 'Top-priority tasks by completion rate',
            tasks: 'tasks',
            taskCol: 'Task',
            statusCol: 'Status',
            itemsCol: 'Items',
            progressCol: 'Progress',
            noProgress: 'No progress data yet',
            noStatus: 'No status data',
            noTrend: 'No trend data',
            noTaskDetails: 'No task details available',
            live: 'Live',
            progressSeries: 'Progress %',
            remainingSeries: 'Remaining',
        },
        vi: {
            loadError: 'Khong the tai du lieu dashboard. Vui long thu lai.',
            loading: 'Dang tai dashboard annotator...',
            hello: 'Xin chao',
            updated: 'Cap nhat',
            liveData: 'Du lieu truc tiep tu co so du lieu',
            refresh: 'Lam moi',
            productivity: 'Nang suat',
            retry: 'Thu lai',
            completionRate: 'Ti le hoan thanh',
            remainingItems: 'So muc con lai',
            activeTasksSnapshot: 'So task dang hoat dong',
            totalAssigned: 'Tong da giao',
            completed: 'Da hoan thanh',
            inProgress: 'Dang xu ly',
            pendingReview: 'Cho duyet',
            totalAssignedNote: 'Tong task duoc giao cho ban',
            completedNote: 'da hoan thanh',
            inProgressNote: 'Task dang duoc xu ly',
            pendingReviewNote: 'Dang cho reviewer duyet',
            projectProgress: 'Tien do du an',
            projectProgressSub: 'Muc do hoan thanh theo du an',
            statusDistribution: 'Phan bo trang thai',
            statusDistributionSub: 'Ty le task theo trang thai',
            workloadIntensity: 'Cuong do cong viec',
            workloadIntensitySub: 'Tien do va so muc con lai',
            topTasks: 'Tong quan task uu tien',
            topTasksSub: 'Task uu tien theo muc hoan thanh',
            tasks: 'task',
            taskCol: 'Task',
            statusCol: 'Trang thai',
            itemsCol: 'So luong',
            progressCol: 'Tien do',
            noProgress: 'Chua co du lieu tien do',
            noStatus: 'Chua co du lieu trang thai',
            noTrend: 'Chua co du lieu xu huong',
            noTaskDetails: 'Chua co chi tiet task',
            live: 'Truc tiep',
            progressSeries: 'Tien do %',
            remainingSeries: 'Con lai',
        },
    };

    const t = (key) => copy[language]?.[key] || copy.en[key] || key;

    const [dashboard, setDashboard] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboard = async ({ silent = false } = {}) => {
        if (!silent) {
            setLoading(true);
        }

        setError('');

        try {
            const [dashboardRes, profileRes] = await Promise.all([
                api.get('/Dashboard/annotator'),
                api.get('/profile'),
            ]);

            const dashboardPayload = dashboardRes?.data?.data ?? dashboardRes?.data ?? null;
            const profilePayload = profileRes?.data?.data ?? profileRes?.data ?? null;

            setDashboard(dashboardPayload);
            setProfile(profilePayload);
            setLastUpdated(new Date());
        } catch (e) {
            setError(t('loadError'));
            console.error('Failed to fetch annotator dashboard:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const stats = useMemo(() => {
        const raw = dashboard?.stats || EMPTY_STATS;

        const totalAssigned = Number(raw.totalAssigned || 0);
        const completed = Number(raw.completed || 0);
        const inProgress = Number(raw.inProgress || 0);
        const pendingReview = Number(raw.pendingReview || 0);
        const remaining = Math.max(totalAssigned - completed, 0);
        const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

        return {
            totalAssigned,
            completed,
            inProgress,
            pendingReview,
            remaining,
            completionRate,
        };
    }, [dashboard]);

    const recentTasks = useMemo(() => {
        const source = Array.isArray(dashboard?.recentTasks) ? dashboard.recentTasks : [];

        return source.map((task, index) => {
            const totalItems = Number(task.totalItems || 0);
            const completedItems = Number(task.completedItems || 0);
            const progressFromApi = Number(task.progressPercent);
            const progressPercent = Number.isFinite(progressFromApi)
                ? Math.min(100, Math.max(0, progressFromApi))
                : (totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);

            const derivedStatus = task.status || (progressPercent >= 100 ? 'Completed' : progressPercent > 0 ? 'InProgress' : 'Assigned');

            return {
                id: task.id || `${task.projectName || 'task'}-${index}`,
                projectName: task.projectName || task.taskName || `Task ${index + 1}`,
                totalItems,
                completedItems,
                remainingItems: Math.max(totalItems - completedItems, 0),
                progressPercent,
                status: derivedStatus,
            };
        });
    }, [dashboard]);

    const statusDistribution = useMemo(() => {
        const notStarted = Math.max(
            stats.totalAssigned - stats.completed - stats.inProgress - stats.pendingReview,
            0
        );

        return [
            { name: 'Completed', value: stats.completed, color: '#2f855a' },
            { name: 'In Progress', value: stats.inProgress, color: '#2b6cb0' },
            { name: 'Pending Review', value: stats.pendingReview, color: '#d69e2e' },
            { name: 'Not Started', value: notStarted, color: '#718096' },
        ].filter((item) => item.value > 0);
    }, [stats]);

    const lineSeries = useMemo(
        () => recentTasks.slice(0, 10).map((t) => ({
            name: t.projectName,
            progressPercent: t.progressPercent,
            remainingItems: t.remainingItems,
        })),
        [recentTasks]
    );

    const topTasks = useMemo(
        () => [...recentTasks].sort((a, b) => b.progressPercent - a.progressPercent).slice(0, 6),
        [recentTasks]
    );

    const avgProgress = useMemo(() => {
        if (recentTasks.length === 0) {
            return 0;
        }

        const total = recentTasks.reduce((sum, t) => sum + t.progressPercent, 0);
        return Math.round(total / recentTasks.length);
    }, [recentTasks]);

    const getStatusClass = (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized.includes('complete')) return 'bg-success-subtle text-success';
        if (normalized.includes('progress')) return 'bg-primary-subtle text-primary';
        if (normalized.includes('review')) return 'bg-warning-subtle text-warning-emphasis';
        return 'bg-secondary-subtle text-secondary';
    };

    const uiPalette = {
        pageBg: isDark ? '#0b1220' : '#f8fafc',
        cardBg: isDark ? 'linear-gradient(180deg, #111b2f 0%, #0f172a 100%)' : '#ffffff',
        cardBorder: isDark ? '#1e2a44' : '#dbe6f2',
        stripBg: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
        chipBg: isDark ? '#1b2b4a' : '#e5f0fb',
        chipText: isDark ? '#c9dcff' : '#1f4e79',
        chipBorder: isDark ? '#2f4a75' : '#cfe0f1',
        liveBg: isDark ? '#1a253b' : '#ffffff',
        liveText: isDark ? '#cbd5e1' : '#475569',
        chartGrid: isDark ? 'rgba(148, 163, 184, 0.25)' : '#d9e2ec',
        chartTick: isDark ? '#cbd5e1' : '#4a5568',
        tooltipBg: isDark ? '#111827' : '#ffffff',
        tooltipBorder: isDark ? '#334155' : '#dbe6f2',
        tooltipText: isDark ? '#e2e8f0' : '#1e293b',
    };

    const cardMeta = [
        {
            label: t('totalAssigned'),
            value: stats.totalAssigned,
            icon: FileStack,
            color: isDark ? '#93c5fd' : '#1f4e79',
            bg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#e8f1fb',
            note: t('totalAssignedNote'),
        },
        {
            label: t('completed'),
            value: stats.completed,
            icon: CheckCircle2,
            color: isDark ? '#86efac' : '#2f855a',
            bg: isDark ? 'rgba(34, 197, 94, 0.18)' : '#e9f7ef',
            note: `${stats.completionRate}% ${t('completedNote')}`,
        },
        {
            label: t('inProgress'),
            value: stats.inProgress,
            icon: Target,
            color: isDark ? '#7dd3fc' : '#2b6cb0',
            bg: isDark ? 'rgba(14, 165, 233, 0.18)' : '#eaf3ff',
            note: t('inProgressNote'),
        },
        {
            label: t('pendingReview'),
            value: stats.pendingReview,
            icon: AlertCircle,
            color: isDark ? '#fcd34d' : '#b7791f',
            bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fff7e6',
            note: t('pendingReviewNote'),
        },
    ];

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboard({ silent: true });
    };

    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ background: uiPalette.pageBg }}>
                <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="fw-medium mb-0" style={{ color: uiPalette.chartTick }}>{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className={`container-fluid py-4 px-xl-4 annotator-dashboard ${isDark ? 'annotator-dashboard-dark' : ''}`}>
            <div className="row g-3 align-items-center mb-4">
                <div className="col-12 col-lg-7">
                    <h2 className="dashboard-title mb-2">
                        {t('hello')} {profile?.name || user?.name || user?.user?.name || 'Annotator'}
                    </h2>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="badge dashboard-chip px-3 py-2 rounded-pill" style={{ background: uiPalette.chipBg, color: uiPalette.chipText, border: `1px solid ${uiPalette.chipBorder}` }}>
                            <Clock3 size={14} className="me-1" />
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-muted small">
                            {lastUpdated
                                ? `${t('updated')} ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : t('liveData')}
                        </span>
                    </div>
                </div>
                <div className="col-12 col-lg-5 d-flex justify-content-lg-end gap-2">
                    <button
                        className="btn btn-outline-primary d-flex align-items-center gap-2"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCcw size={16} className={refreshing ? 'spin' : ''} />
                        {t('refresh')}
                    </button>
                    <div className="badge border d-flex align-items-center px-3 rounded-pill" style={{ background: uiPalette.liveBg, color: uiPalette.liveText, borderColor: uiPalette.cardBorder }}>
                        <CircleGauge size={14} className="me-1" /> {t('productivity')} {avgProgress}%
                    </div>
                </div>
            </div>

            {!!error && (
                <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4" role="alert">
                    <span>{error}</span>
                    <button className="btn btn-sm btn-outline-warning" onClick={handleRefresh} disabled={refreshing}>
                        {t('retry')}
                    </button>
                </div>
            )}

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="summary-strip summary-strip-success">
                        <p className="mb-1 text-muted small">{t('completionRate')}</p>
                        <h4 className="mb-0 fw-bold">{stats.completionRate}%</h4>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="summary-strip summary-strip-info">
                        <p className="mb-1 text-muted small">{t('remainingItems')}</p>
                        <h4 className="mb-0 fw-bold">{formatCompact(stats.remaining)}</h4>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="summary-strip summary-strip-neutral">
                        <p className="mb-1 text-muted small">{t('activeTasksSnapshot')}</p>
                        <h4 className="mb-0 fw-bold">{recentTasks.length}</h4>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                {cardMeta.map((card) => (
                    <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
                        <div className="card dashboard-card h-100 border-0">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="icon-box" style={{ backgroundColor: card.bg, color: card.color }}>
                                        <card.icon size={20} />
                                    </span>
                                    <span className="badge border" style={{ background: uiPalette.liveBg, color: uiPalette.liveText, borderColor: uiPalette.cardBorder }}>{t('live')}</span>
                                </div>
                                <p className="metric-label mb-1">{card.label}</p>
                                <h3 className="fw-bold mb-1">{formatCompact(card.value)}</h3>
                                <p className="small text-muted mb-0">{card.note}</p>
                            </div>
                            <div className="card-accent" style={{ backgroundColor: card.color }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4 mb-4">
                <div className="col-12 col-xl-8">
                    <div className="card dashboard-card h-100 border-0">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h5 className="fw-bold mb-1">{t('projectProgress')}</h5>
                                    <p className="text-muted mb-0 small">{t('projectProgressSub')}</p>
                                </div>
                                <span className="badge border rounded-pill" style={{ background: uiPalette.liveBg, color: uiPalette.liveText, borderColor: uiPalette.cardBorder }}>{recentTasks.length} {t('tasks')}</span>
                            </div>
                            <div style={{ height: 320 }}>
                                {recentTasks.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={recentTasks.slice(0, 8)}>
                                            <defs>
                                                <linearGradient id="barMainGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#1f4e79" stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor="#1f4e79" stopOpacity={0.35} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={uiPalette.chartGrid} />
                                            <XAxis dataKey="projectName" tick={{ fontSize: 11, fill: uiPalette.chartTick }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: uiPalette.chartTick }} axisLine={false} tickLine={false} unit="%" />
                                            <Tooltip
                                                formatter={(value) => [`${value}%`, 'Progress']}
                                                contentStyle={{ background: uiPalette.tooltipBg, borderColor: uiPalette.tooltipBorder, borderRadius: 10, color: uiPalette.tooltipText }}
                                            />
                                            <Bar dataKey="progressPercent" radius={[8, 8, 0, 0]} barSize={28}>
                                                {recentTasks.slice(0, 8).map((task, idx) => (
                                                    <Cell
                                                        key={`${task.id}-${idx}`}
                                                        fill={task.progressPercent >= 100 ? '#2f855a' : 'url(#barMainGradient)'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">{t('noProgress')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="card dashboard-card h-100 border-0">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-1">{t('statusDistribution')}</h5>
                            <p className="text-muted small mb-3">{t('statusDistributionSub')}</p>
                            <div style={{ height: 300 }}>
                                {statusDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusDistribution}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={58}
                                                outerRadius={96}
                                                paddingAngle={2}
                                            >
                                                {statusDistribution.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [value, 'Tasks']}
                                                contentStyle={{ background: uiPalette.tooltipBg, borderColor: uiPalette.tooltipBorder, borderRadius: 10, color: uiPalette.tooltipText }}
                                            />
                                            <Legend verticalAlign="bottom" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">{t('noStatus')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-6">
                    <div className="card dashboard-card h-100 border-0">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-1">{t('workloadIntensity')}</h5>
                                <Activity size={18} className="text-muted" />
                            </div>
                            <p className="text-muted small mb-3">{t('workloadIntensitySub')}</p>
                            <div style={{ height: 300 }}>
                                {lineSeries.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={lineSeries}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={uiPalette.chartGrid} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: uiPalette.chartTick }} />
                                            <YAxis tick={{ fontSize: 11, fill: uiPalette.chartTick }} />
                                            <Tooltip contentStyle={{ background: uiPalette.tooltipBg, borderColor: uiPalette.tooltipBorder, borderRadius: 10, color: uiPalette.tooltipText }} />
                                            <Line
                                                type="monotone"
                                                dataKey="progressPercent"
                                                stroke="#1f4e79"
                                                strokeWidth={2.5}
                                                name={t('progressSeries')}
                                                dot={{ r: 3 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="remainingItems"
                                                stroke="#b7791f"
                                                strokeWidth={2}
                                                name={t('remainingSeries')}
                                                dot={{ r: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">{t('noTrend')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-6">
                    <div className="card dashboard-card h-100 border-0">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-1">{t('topTasks')}</h5>
                            <p className="text-muted small mb-3">{t('topTasksSub')}</p>
                            {topTasks.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr className="small text-muted">
                                                <th>{t('taskCol')}</th>
                                                <th>{t('statusCol')}</th>
                                                <th>{t('itemsCol')}</th>
                                                <th>{t('progressCol')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topTasks.map((task) => (
                                                <tr key={task.id}>
                                                    <td className="fw-semibold">{task.projectName}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${getStatusClass(task.status)}`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted small">{task.completedItems}/{task.totalItems}</td>
                                                    <td style={{ minWidth: 150 }}>
                                                        <div className="progress" role="progressbar" aria-valuenow={task.progressPercent} aria-valuemin="0" aria-valuemax="100" style={{ height: 8 }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{
                                                                    width: `${task.progressPercent}%`,
                                                                    backgroundColor: task.progressPercent >= 100 ? '#2f855a' : '#1f4e79',
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <small className="text-muted">{task.progressPercent}%</small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-5 text-center text-muted">{t('noTaskDetails')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`

                .dashboard-title {
                    color: var(--text-main);
                    font-weight: 750;
                    letter-spacing: -0.01em;
                }

                .dashboard-chip {
                    backdrop-filter: blur(6px);
                }

                .dashboard-card {
                    border: 1px solid var(--card-border) !important;
                    background: var(--card-bg);
                    box-shadow: var(--shadow-soft);
                    border-radius: 16px;
                }

                .icon-box {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .metric-label {
                    font-size: 0.78rem;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--text-soft);
                    font-weight: 700;
                }

                .card-accent {
                    height: 4px;
                    width: 100%;
                    border-bottom-left-radius: 16px;
                    border-bottom-right-radius: 16px;
                }

                .summary-strip {
                    background: var(--strip-bg);
                    border: 1px solid var(--card-border);
                    border-left-width: 4px;
                    border-radius: 12px;
                    padding: 0.85rem 1rem;
                }

                .summary-strip-success { border-left-color: #2f855a; }
                .summary-strip-info { border-left-color: #2b6cb0; }
                .summary-strip-neutral { border-left-color: #718096; }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .dashboard-title {
                        font-size: 1.7rem;
                    }
                }

                .annotator-dashboard {
                    --card-bg: ${uiPalette.cardBg};
                    --strip-bg: ${uiPalette.stripBg};
                    --card-border: ${uiPalette.cardBorder};
                    --text-main: ${isDark ? '#f8fafc' : '#0f172a'};
                    --text-soft: ${isDark ? '#cbd5e1' : '#64748b'};
                    --shadow-soft: ${isDark ? '0 12px 28px rgba(2, 6, 23, 0.45)' : '0 12px 28px rgba(15, 23, 42, 0.08)'};
                }

                .annotator-dashboard-dark .text-muted {
                    color: #9fb0c6 !important;
                }

                .annotator-dashboard-dark .table {
                    color: #e2e8f0;
                }

                .annotator-dashboard-dark .table thead th {
                    color: #9fb0c6 !important;
                    border-bottom-color: #263247;
                }

                .annotator-dashboard-dark .table td {
                    border-color: #1e2a3f;
                }

                .annotator-dashboard-dark .progress {
                    background-color: #1e293b;
                }
            `}</style>
        </div>
    );
};
