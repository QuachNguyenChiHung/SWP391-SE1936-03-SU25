import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - isOpen: bool
// - title: string
// - message: string or node
// - onConfirm: func
// - onCancel: func
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content-custom">
        <h5 className="fw-bold">{title || 'Confirm'}</h5>
        <div className="mb-3">{message}</div>
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-light" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.any,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ConfirmModal;
