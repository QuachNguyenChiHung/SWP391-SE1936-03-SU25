import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';

import api from '../../shared/utils/api.js';

export default function ReviewersPanel({ onAssign, compact = false }) {
    const [reviewers, setReviewers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchReviewers = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/Tasks/reviewers');
                if (!mounted) return;
                setReviewers(res?.data || []);
            } catch (e) {
                console.error('Failed to fetch reviewers', e);
                if (mounted) setError('Failed to load reviewers');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchReviewers();
        return () => { mounted = false; };
    }, []);

    if (loading) return (<div className="d-flex justify-content-center py-2"><Spinner animation="border" size="sm" /></div>);
    if (error) return (<div className="text-danger small">{error}</div>);

    return (
        <div className={compact ? 'list-group list-group-flush' : 'list-group'}>
            {reviewers.length === 0 && <div className="text-muted small p-2">No reviewers found</div>}
            {reviewers.map(r => (
                <div key={r.id} className="list-group-item d-flex align-items-center justify-content-between" style={{ paddingTop: compact ? 6 : 10, paddingBottom: compact ? 6 : 10 }}>
                    <div className="d-flex align-items-center" style={{ gap: compact ? 8 : 12 }}>
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: compact ? 28 : 36, height: compact ? 28 : 36, fontSize: compact ? 12 : 14 }}>
                            {r.name ? r.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'}
                        </div>
                        <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                            <div className="fw-bold small mb-0" style={{ lineHeight: 1 }}>{r.name}</div>
                            <div className="small text-muted" style={{ display: compact ? 'none' : 'block' }}>{r.email} • {r.activeReviewCount} active</div>
                            {compact && <div className="small text-muted">{r.activeReviewCount} active</div>}
                        </div>
                    </div>
                    <div>
                        <Button size="sm" variant="primary" onClick={() => onAssign && onAssign(r)}>Assign Review</Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

ReviewersPanel.propTypes = {
    onAssign: PropTypes.func,
    compact: PropTypes.bool
};
