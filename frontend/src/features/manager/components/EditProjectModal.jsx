import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Pencil, Save } from 'lucide-react';
import { ProjectStatus } from '../../../shared/types/types.js';

// Props:
// - isOpen, onClose, editName, setEditName, editDescription, setEditDescription, editStatus, setEditStatus, editDeadline, setEditDeadline, onSave
const EditProjectModal = ({ isOpen, onClose, editName, setEditName, editDescription, setEditDescription, editStatus, setEditStatus, editDeadline, setEditDeadline, onSave }) => {
  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2"><Pencil size={20} /></Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column gap-3">
        <Form.Group>
          <Form.Label className="fw-semibold">Project Name</Form.Label>
          <Form.Control value={editName} onChange={(e) => setEditName(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label className="fw-semibold">Description</Form.Label>
          <Form.Control as="textarea" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label className="fw-semibold">Status</Form.Label>
          <Form.Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
            {Object.values(ProjectStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group>
          <Form.Label className="fw-semibold">Deadline</Form.Label>
          <Form.Control type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onSave} className="d-flex align-items-center gap-2"><Save size={16} /> Save Changes</Button>
      </Modal.Footer>
    </Modal>
  );
};

EditProjectModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  editName: PropTypes.string,
  setEditName: PropTypes.func,
  editDescription: PropTypes.string,
  setEditDescription: PropTypes.func,
  editStatus: PropTypes.string,
  setEditStatus: PropTypes.func,
  editDeadline: PropTypes.string,
  setEditDeadline: PropTypes.func,
  onSave: PropTypes.func,
};

export default EditProjectModal;
