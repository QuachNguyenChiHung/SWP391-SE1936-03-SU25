import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { ProjectStatus } from "../types";

export default function StatusBadge({ status }) {
    const config = {
        [ProjectStatus.Active]: { bg: '#eff6ff', text: '#1e40af', icon: Clock, label: 'Active' },
        [ProjectStatus.Archived]: { bg: '#f1f5f9', text: '#475569', icon: CheckCircle2, label: 'Archived' },
        [ProjectStatus.Completed]: { bg: '#ecfdf5', text: '#065f46', icon: CheckCircle2, label: 'Completed' },
        [ProjectStatus.Draft]: { bg: '#fff7ed', text: '#b45309', icon: AlertCircle, label: 'Draft' },
    };

    const defaultStyle = { bg: '#f1f5f9', text: '#475569', icon: CheckCircle2, label: status || 'Unknown' };
    const style = config[status] || defaultStyle;
    const Icon = style.icon;

    return (
        <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill border"
            style={{
                backgroundColor: style.bg,
                color: style.text,
                borderColor: 'transparent',
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
            <Icon size={12} />
            {style.label}
        </span>
    );
};