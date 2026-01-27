import React, { useState, useEffect } from 'react';
import {
    Check,
    X,
    Flag,
    MessageSquare,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    AlertCircle,
    Pencil,
    Save,
    FileText
} from 'lucide-react';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../services/mockData';
import { DataItemStatus } from '../../types';

interface ReviewerInterfaceProps {
    onTitleChange?: (title: string) => void;
}

export const ReviewerInterface: React.FC<ReviewerInterfaceProps> = ({ onTitleChange }) => {
    const task = MOCK_TASKS[0]; // In real app, this comes from a queue
    const project = MOCK_PROJECTS.find(p => p.id === task.projectId);

    const [showLabels, setShowLabels] = useState(true);
    const [rejectReason, setRejectReason] = useState('');
    const [actionState, setActionState] = useState<'IDLE' | 'REJECTING'>('IDLE');

    // Guidelines State
    const [guidelines, setGuidelines] = useState('');
    const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);

    useEffect(() => {
        if (onTitleChange) {
            onTitleChange('Review Queue');
        }
    }, [onTitleChange]);

    useEffect(() => {
        if (project?.guidelines) {
            setGuidelines(project.guidelines);
        }
    }, [project]);

    const REJECT_REASONS = [
        "Loose Bounding Box",
        "Wrong Class Label",
        "Missed Object",
        "Occlusion Error",
        "Other"
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-300">
            {/* Top Bar Stats */}
            <div className="flex justify-between items-center mb-4 px-1">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Review Queue</h2>
                    <p className="text-sm text-slate-500">12 items pending validation</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                        <p className="text-xs font-bold text-slate-700">98.5% Accuracy</p>
                        <p className="text-[10px] text-slate-400">Your session score</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-indigo-600 flex items-center justify-center text-indigo-700 font-bold text-xs bg-indigo-50">
                        12
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Main Review Canvas */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">

                    {/* Toolbar */}
                    <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item #{task.id}</span>
                            <span className="h-4 w-px bg-slate-200"></span>
                            <button
                                onClick={() => setShowLabels(!showLabels)}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
                                {showLabels ? 'Hide Labels' : 'Show Labels'}
                            </button>
                        </div>
                        <button className="text-slate-400 hover:text-slate-700">
                            <Maximize2 size={16} />
                        </button>
                    </div>

                    {/* Image Viewer */}
                    <div className="flex-1 bg-slate-900 flex items-center justify-center relative overflow-hidden group">
                        <img src={task.imageUrl} alt="Review" className="max-w-full max-h-full object-contain" />

                        {showLabels && task.annotations.map((ann) => {
                            const labelClass = project?.classes.find(c => c.id === ann.labelId);
                            return (
                                <div
                                    key={ann.id}
                                    className="absolute border-2 bg-white/10"
                                    style={{
                                        borderColor: labelClass?.color || '#000',
                                        left: ann.coordinates.x,
                                        top: ann.coordinates.y,
                                        width: ann.coordinates.width,
                                        height: ann.coordinates.height
                                    }}
                                >
                                    {/* Label Name Tag on Box */}
                                    <div
                                        className="absolute -top-6 left-[-2px] px-1.5 py-0.5 text-[10px] font-bold text-white rounded-t shadow-sm flex items-center gap-1 whitespace-nowrap"
                                        style={{ backgroundColor: labelClass?.color }}
                                    >
                                        {labelClass?.name}
                                        {ann.confidence && (
                                            <span className="opacity-80 font-normal ml-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Action Bar (Footer) */}
                    <div className="p-4 bg-white border-t border-slate-200">
                        {actionState === 'REJECTING' ? (
                            <div className="animate-in slide-in-from-bottom-2 fade-in">
                                <p className="text-sm font-semibold text-slate-800 mb-3">Select Rejection Reason:</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {REJECT_REASONS.map(reason => (
                                        <button
                                            key={reason}
                                            onClick={() => setRejectReason(reason)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${rejectReason === reason
                                                ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500/20'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActionState('IDLE')}
                                        className="px-4 py-2 text-sm text-slate-500 font-medium hover:text-slate-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={!rejectReason}
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        Confirm Rejection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 h-12">
                                <button
                                    onClick={() => setActionState('REJECTING')}
                                    className="flex-1 h-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-semibold text-sm"
                                >
                                    <X size={18} />
                                    Reject
                                </button>
                                <button className="h-full px-4 flex items-center justify-center gap-2 bg-white border border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors font-semibold text-sm" title="Escalate to Manager">
                                    <Flag size={18} />
                                </button>
                                <button className="flex-[2] h-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm shadow-green-200 transition-all font-bold text-sm transform active:scale-[0.98]">
                                    <Check size={18} />
                                    Accept & Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Sidebar (Desktop Only) */}
                <div className="hidden lg:flex w-80 flex-col gap-4 overflow-y-auto">

                    {/* Guidelines Panel */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs">
                                <FileText size={14} />
                                <span>Guidelines</span>
                            </div>
                            <button
                                onClick={() => setIsEditingGuidelines(!isEditingGuidelines)}
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                title={isEditingGuidelines ? "Cancel" : "Edit Guidelines"}
                            >
                                {isEditingGuidelines ? <X size={14} /> : <Pencil size={14} />}
                            </button>
                        </div>

                        <div className="p-4 bg-white">
                            {isEditingGuidelines ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={guidelines}
                                        onChange={(e) => setGuidelines(e.target.value)}
                                        className="w-full h-32 text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-sans"
                                        placeholder="Enter labeling rules..."
                                    />
                                    <button
                                        onClick={() => setIsEditingGuidelines(false)}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-1.5 rounded-md text-xs font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        <Save size={12} />
                                        Save Guidelines
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                                    {guidelines || "No specific guidelines set for this project."}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Annotations List */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1 overflow-y-auto min-h-[150px]">
                        <h3 className="font-semibold text-slate-800 text-sm mb-3">Annotations ({task.annotations.length})</h3>
                        <div className="space-y-2">
                            {task.annotations.map((ann, i) => {
                                const label = project?.classes.find(c => c.id === ann.labelId);
                                return (
                                    <div key={ann.id} className="flex items-center p-2 rounded-lg border border-slate-100 bg-slate-50 hover:border-slate-300 transition-colors">
                                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: label?.color }}></span>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-slate-900">{label?.name}</p>
                                            <p className="text-[10px] text-slate-500">Confidence: {ann.confidence ? (ann.confidence * 100).toFixed(0) : 100}%</p>
                                        </div>
                                        <span className="text-xs text-slate-400">#{i + 1}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* History / Comments */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-1/3 flex flex-col min-h-[150px]">
                        <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-sm">
                            <MessageSquare size={14} />
                            <span>Item History</span>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg p-3 overflow-y-auto mb-3">
                            <div className="text-xs text-slate-500 space-y-3">
                                <div className="flex gap-2">
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">S</div>
                                    <div>
                                        <p className="font-medium text-slate-700">Sarah A.</p>
                                        <p>Submitted initial annotation.</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">2 hours ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Add comment..."
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};