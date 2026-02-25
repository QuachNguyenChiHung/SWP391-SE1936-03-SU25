import React from 'react';
import Button from 'react-bootstrap/Button';
import { ArrowLeft } from 'lucide-react';

export default function ProjectHeader({ project, onBack }) {
    if (!project) return null;
    return (
        <div className="d-flex align-items-center gap-3 mb-2">
            <Button variant="light" className="border shadow-sm bg-white" onClick={onBack}>
                <ArrowLeft size={20} />
            </Button>
            <div>
                <h2 className="h4 fw-bold text-dark mb-1">{project.name}</h2>
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small border-end pe-2 me-1">{project.type}</span>
                    {project.deadline && (
                        <span className="text-muted small ms-2">Deadline: {String(project.deadline).slice(8,10)}/{String(project.deadline).slice(5,7)}/{String(project.deadline).slice(0,4)}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
