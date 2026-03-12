import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FileText, Pencil } from 'lucide-react';

// Props:
// - isOpen, onClose, isEditing, guidelinesText, setGuidelinesText, setIsEditing
const GuidelinesModal = ({ isOpen, onClose, isEditing, guidelinesText, setGuidelinesText, setIsEditing, onSave }) => {
  return (
    <Modal show={isOpen} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2"><FileText size={20} className="text-primary" /> Project Guidelines</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isEditing ? (
          <div className="d-flex flex-column gap-2">
            <label className="small fw-bold text-muted">EDIT CONTENT</label>
            <Form.Control as="textarea" rows={10} value={guidelinesText} onChange={(e) => setGuidelinesText(e.target.value)} placeholder="Enter detailed instructions..." />
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            <label className="small fw-bold text-muted">CURRENT GUIDELINES</label>
            <div className="p-3 bg-light rounded border" style={{ minHeight: '200px', whiteSpace: 'pre-line' }}>{guidelinesText || "No guidelines set for this project."}</div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {isEditing ? (
          <>
            <Button variant="light" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button variant="primary" onClick={onSave} className="d-flex align-items-center gap-2"><Pencil size={16} /> Save Changes</Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => setIsEditing(true)} className="w-100 d-flex align-items-center justify-content-center gap-2"><Pencil size={16} /> Edit Guidelines</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

GuidelinesModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  isEditing: PropTypes.bool,
  guidelinesText: PropTypes.string,
  setGuidelinesText: PropTypes.func,
  setIsEditing: PropTypes.func,
  onSave: PropTypes.func,
};

export default GuidelinesModal;
