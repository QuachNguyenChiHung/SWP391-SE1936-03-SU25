import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useUI } from '../../../shared/context/UIContext.jsx';

export const FlagItemModal = ({ show, onConfirm, onCancel, itemName }) => {
    const { language } = useUI();
    const [selectedReason, setSelectedReason] = useState('no_suitable_label');
    const [customReason, setCustomReason] = useState('');

    const copy = {
        en: {
            title: 'Flag Item',
            subtitle: 'Why are you flagging this item?',
            reasons: {
                no_suitable_label: 'No suitable label exists',
                poor_quality: 'Image quality is poor',
                not_relevant: 'Item is not relevant to the project',
                other: 'Other (specify below)'
            },
            additionalNotes: 'Additional notes (optional):',
            placeholder: 'Provide more details...',
            cancel: 'Cancel',
            flagItem: 'Flag Item',
            itemLabel: 'Item:'
        },
        vi: {
            title: 'Danh dau muc',
            subtitle: 'Tai sao ban danh dau muc nay?',
            reasons: {
                no_suitable_label: 'Khong co nhan phu hop',
                poor_quality: 'Chat luong hinh anh kem',
                not_relevant: 'Muc khong lien quan den du an',
                other: 'Khac (chi tiet ben duoi)'
            },
            additionalNotes: 'Ghi chu them (tuy chon):',
            placeholder: 'Cung cap them chi tiet...',
            cancel: 'Huy',
            flagItem: 'Danh dau',
            itemLabel: 'Muc:'
        }
    };

    const t = copy[language] || copy.en;

    const handleConfirm = () => {
        let reason = t.reasons[selectedReason];
        if (selectedReason === 'other' && customReason.trim()) {
            reason = customReason.trim();
        } else if (customReason.trim()) {
            reason += ` - ${customReason.trim()}`;
        }
        onConfirm(reason);
    };

    if (!show) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={onCancel}
            />

            {/* Modal */}
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ zIndex: 1055 }}
                onClick={onCancel}
            >
                <div
                    className="modal-dialog modal-dialog-centered"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-content border-0 shadow-lg">
                        {/* Header */}
                        <div className="modal-header border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <AlertTriangle size={24} className="text-warning" />
                                <h5 className="modal-title fw-bold mb-0">{t.title}</h5>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onCancel}
                                aria-label="Close"
                            />
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {itemName && (
                                <div className="alert alert-light border mb-3">
                                    <small className="text-muted">{t.itemLabel}</small>
                                    <div className="fw-medium">{itemName}</div>
                                </div>
                            )}

                            <p className="text-muted mb-3">{t.subtitle}</p>

                            {/* Reason Options */}
                            <div className="mb-3">
                                {Object.keys(t.reasons).map((key) => (
                                    <div key={key} className="form-check mb-2">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="flagReason"
                                            id={`reason-${key}`}
                                            value={key}
                                            checked={selectedReason === key}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={`reason-${key}`}
                                        >
                                            {t.reasons[key]}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Additional Notes */}
                            <div className="mb-3">
                                <label htmlFor="customReason" className="form-label small fw-semibold">
                                    {t.additionalNotes}
                                </label>
                                <textarea
                                    id="customReason"
                                    className="form-control"
                                    rows="3"
                                    placeholder={t.placeholder}
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer border-top">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onCancel}
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                className="btn btn-warning"
                                onClick={handleConfirm}
                            >
                                <AlertTriangle size={16} className="me-2" />
                                {t.flagItem}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FlagItemModal;
