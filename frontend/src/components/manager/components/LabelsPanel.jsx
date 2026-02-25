import React from 'react';
import Button from 'react-bootstrap/Button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function LabelsPanel({ listLabels, openAddLabel, openEditLabelModal, openDeleteLabelModal }) {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div><h5 className="fw-bold mb-0">Labels</h5><small className="text-muted">Manage object classes</small></div>
                <Button variant="primary" size="sm" onClick={openAddLabel} className="d-flex align-items-center gap-2"><Plus size={16} /> Add Label</Button>
            </div>
            <div className="row g-3">
                {listLabels && listLabels.length > 0 ? (
                    listLabels.map(cls => (
                        <div key={cls.id} className="col-12 col-md-6 col-lg-3">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="rounded shadow-sm" style={{ width: 36, height: 36, backgroundColor: cls.color }}></div>
                                        <div>
                                            <div className="fw-bold text-dark">{cls.name}</div>
                                            {cls.hotkey && <small className="text-muted border px-1 rounded bg-light">Key: {cls.hotkey}</small>}
                                        </div>
                                    </div>
                                    <div className="d-flex gap-1">
                                        <Button variant="link" className="text-muted p-1" onClick={(e) => openEditLabelModal(cls, e)}><Pencil size={16} /></Button>
                                        <Button variant="link" className="text-danger p-1" onClick={(e) => openDeleteLabelModal(cls, e)}><Trash2 size={16} /></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5 text-muted">No labels found</div>
                        </div>
                    </div>
                )}
                <div className="col-12 col-md-6 col-lg-3">
                    <button onClick={openAddLabel} className="card border border-2 border-dashed bg-light h-100 w-100 p-0 text-muted hover-bg-light" style={{ minHeight: '80px' }}>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center">
                            <Plus size={24} className="mb-1" />
                            <span className="small fw-medium">Create New Label</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
