import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function LabelsPanel({ listLabels, openAddLabel, openEditLabelModal, openDeleteLabelModal }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter labels based on search term
    const filteredLabels = listLabels?.filter(label => {
        if (!searchTerm.trim()) return true;
        
        const search = searchTerm.toLowerCase();
        const name = label.name?.toLowerCase() || '';
        const color = label.color?.toLowerCase() || '';
        
        return name.includes(search) || color.includes(search);
    }) || [];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Labels</h5>
                    <small className="text-muted">
                        Showing {filteredLabels.length} of {listLabels?.length || 0} labels
                    </small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <div className="input-group" style={{ width: '350px' }}>
                        <input
                            type="text"
                            className="form-control p-2"
                            placeholder="Search labels..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    // Search is client-side, filtering happens automatically
                                }
                            }}
                        />
                        {searchTerm && (
                            <button 
                                className="btn btn-outline-secondary" 
                                onClick={() => setSearchTerm('')}
                                title="Clear search"
                            >
                                ×
                            </button>
                        )}
                        <button 
                            className="btn btn-primary" 
                            onClick={() => {
                                // Client-side search, just keep current searchTerm
                            }}
                            title="Search"
                        >
                            🔍
                        </button>
                    </div>
                    <Button variant="primary" size="sm" onClick={openAddLabel} className="d-flex align-items-center gap-2">
                        <Plus size={16} /> Add Label
                    </Button>
                </div>
            </div>
            <div className="row g-3">
                {filteredLabels && filteredLabels.length > 0 ? (
                    filteredLabels.map(cls => (
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
                            <div className="card-body text-center py-5 text-muted">
                                {searchTerm ? `No labels found matching "${searchTerm}"` : 'No labels found'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
