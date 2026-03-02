import { CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export const ProgressIndicator = ({ 
    completed = 0, 
    total = 0, 
    startTime = null,
    compact = false 
}) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remaining = total - completed;

    // Calculate estimated time remaining
    const getEstimatedTime = () => {
        if (!startTime || completed === 0) return null;
        
        const elapsed = Date.now() - new Date(startTime).getTime();
        const avgTimePerItem = elapsed / completed;
        const estimatedRemaining = avgTimePerItem * remaining;
        
        const minutes = Math.floor(estimatedRemaining / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `~${hours}h ${minutes % 60}m remaining`;
        } else if (minutes > 0) {
            return `~${minutes}m remaining`;
        } else {
            return '< 1m remaining';
        }
    };

    // Calculate items per hour
    const getItemsPerHour = () => {
        if (!startTime || completed === 0) return 0;
        
        const elapsed = Date.now() - new Date(startTime).getTime();
        const hours = elapsed / 3600000;
        return Math.round(completed / hours);
    };

    const estimatedTime = getEstimatedTime();
    const itemsPerHour = getItemsPerHour();

    if (compact) {
        return (
            <div className="progress-indicator-compact">
                <div className="progress-bar-wrapper">
                    <div className="progress-bar-bg">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <span className="progress-text">{completed}/{total}</span>
                </div>
                <style>{`
                    .progress-indicator-compact {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .progress-bar-wrapper {
                        position: relative;
                        flex: 1;
                        min-width: 100px;
                    }

                    .progress-bar-bg {
                        height: 8px;
                        background: #e2e8f0;
                        border-radius: 4px;
                        overflow: hidden;
                    }

                    .progress-bar-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
                        transition: width 0.3s ease;
                        border-radius: 4px;
                    }

                    .progress-text {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 10px;
                        font-weight: 700;
                        color: #1e293b;
                        text-shadow: 0 0 2px white;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="progress-indicator">
            <div className="progress-header">
                <div className="progress-title">
                    <CheckCircle2 size={20} className="text-primary" />
                    <span>Task Progress</span>
                </div>
                <div className="progress-percentage">{percentage}%</div>
            </div>

            <div className="progress-bar-container">
                <div className="progress-bar-track">
                    <div 
                        className="progress-bar-active" 
                        style={{ width: `${percentage}%` }}
                    >
                        <div className="progress-bar-shine" />
                    </div>
                </div>
            </div>

            <div className="progress-stats">
                <div className="progress-stat">
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value">{completed}/{total}</span>
                </div>

                {remaining > 0 && (
                    <div className="progress-stat">
                        <Clock size={16} className="text-warning" />
                        <span className="stat-label">Remaining:</span>
                        <span className="stat-value">{remaining} items</span>
                    </div>
                )}

                {itemsPerHour > 0 && (
                    <div className="progress-stat">
                        <TrendingUp size={16} className="text-info" />
                        <span className="stat-label">Rate:</span>
                        <span className="stat-value">{itemsPerHour}/hour</span>
                    </div>
                )}
            </div>

            {estimatedTime && remaining > 0 && (
                <div className="progress-estimate">
                    <Clock size={14} />
                    <span>{estimatedTime}</span>
                </div>
            )}

            {percentage === 100 && (
                <div className="progress-complete">
                    <div className="completion-animation">🎉</div>
                    <span>All items completed!</span>
                </div>
            )}

            <style>{`
                .progress-indicator {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .progress-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 14px;
                }

                .progress-percentage {
                    font-size: 24px;
                    font-weight: 700;
                    color: #6366f1;
                }

                .progress-bar-container {
                    margin-bottom: 12px;
                }

                .progress-bar-track {
                    height: 12px;
                    background: #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-bar-active {
                    height: 100%;
                    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
                    border-radius: 6px;
                    transition: width 0.5s ease;
                    position: relative;
                    overflow: hidden;
                }

                .progress-bar-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shine 2s infinite;
                }

                @keyframes shine {
                    to {
                        left: 100%;
                    }
                }

                .progress-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .progress-stat {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                }

                .stat-label {
                    color: #64748b;
                }

                .stat-value {
                    font-weight: 600;
                    color: #1e293b;
                    margin-left: auto;
                }

                .progress-estimate {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: #fef3c7;
                    border-radius: 8px;
                    font-size: 12px;
                    color: #92400e;
                    font-weight: 500;
                }

                .progress-complete {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                    border-radius: 8px;
                    font-weight: 600;
                    color: #065f46;
                    margin-top: 12px;
                }

                .completion-animation {
                    font-size: 24px;
                    animation: bounce 0.6s ease infinite alternate;
                }

                @keyframes bounce {
                    from {
                        transform: translateY(0);
                    }
                    to {
                        transform: translateY(-4px);
                    }
                }
            `}</style>
        </div>
    );
};
