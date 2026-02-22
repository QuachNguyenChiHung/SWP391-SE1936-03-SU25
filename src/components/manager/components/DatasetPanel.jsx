import React from 'react';
import Button from 'react-bootstrap/Button';

export default function DataItemsPanel({ dataSet, dataLoading, dataPage, setDataPage, onDeleteItem }) {
    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2">Filter</Button>
                </div>
                <small className="text-muted">Showing {dataSet?.totalCount ?? 0} items</small>
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="ps-4 border-bottom-0 text-muted small text-uppercase">Item</th>
                            <th className="border-bottom-0 text-muted small text-uppercase">Details</th>
                            <th className="border-bottom-0 text-muted small text-uppercase">Status</th>
                            <th className="text-end pe-4 border-bottom-0 text-muted small text-uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataLoading ? (
                            <tr><td colSpan={4} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
                        ) : (dataSet?.items && dataSet.items.length > 0) ? dataSet.items.map(item => {
                            const base = (import.meta.env.VITE_URL_UPLOADS || '').replace(/\/$/, '');
                            const thumb = item.thumbnailPath ? `${base}/${item.thumbnailPath.replace(/^\//, '')}` : '';
                            const full = item.filePath ? `${base}/${item.filePath.replace(/^\//, '')}` : '';
                            return (
                                <tr key={item.id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <img src={thumb} alt={item.fileName} className="rounded border" style={{ width: '60px', height: '40px', objectFit: 'cover' }} />
                                            <div>
                                                <div className="fw-medium text-dark" title={item.fileName}>{item.fileName && item.fileName.length > 50 ? item.fileName.slice(0, 50) + '…' : item.fileName}</div>
                                                <small className="text-muted">ID: {item.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="small text-muted">Size: {item.fileSizeKB} KB</div>
                                        <div className="small text-muted">Dim: {item.width} x {item.height}</div>
                                        <div className="small text-muted">Added: {new Date(item.createdAt).toLocaleString()}</div>
                                    </td>
                                    <td><span className="px-2 py-1 rounded-pill text-uppercase fw-bold border bg-light text-muted">{item.status}</span></td>
                                    <td className="text-end pe-4">
                                        <Button variant="link" size="sm" className="text-decoration-none" onClick={() => window.open(full, '_blank')}>View</Button>
                                        <Button variant="link" size="sm" className="text-decoration-none" onClick={() => onDeleteItem ? onDeleteItem(item.id) : null}>Delete</Button>
                                    </td>
                                </tr>
                            )
                        }) : <tr><td colSpan={4} className="text-center py-5 text-muted">No items found</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="small text-muted">Total: {dataSet?.totalCount ?? 0}</div>
                <div>
                    <button className="btn btn-sm btn-outline-secondary me-2" disabled={!dataSet?.hasPreviousPage} onClick={() => setDataPage(prev => Math.max(1, prev - 1))}>Prev</button>
                    <span className="small text-muted">Page {dataSet?.pageNumber ?? dataPage} / {dataSet?.totalPages ?? 1}</span>
                    <button className="btn btn-sm btn-outline-secondary ms-2" disabled={!dataSet?.hasNextPage} onClick={() => setDataPage(prev => prev + 1)}>Next</button>
                </div>
            </div>
        </div>
    );
}
