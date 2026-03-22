import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Download, FileText, Pencil, Upload } from 'lucide-react';

// Props:
// - isOpen, onClose, isEditing, guidelinesText, setGuidelinesText, setIsEditing, onSave
const GuidelinesModal = ({
  isOpen,
  onClose,
  isEditing,
  guidelinesText,
  setGuidelinesText,
  setIsEditing,
  guidelineInfo,
  guidelineFile,
  onGuidelineFileSelect,
  onDownloadGuideline,
  isSaving,
  onSave,
}) => {
  const fileSizeText = guidelineInfo?.fileSize ? `${(guidelineInfo.fileSize / 1024).toFixed(1)} KB` : 'Unknown size';

  return (
    <Modal show={isOpen} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2"><FileText size={20} className="text-primary" /> Project Guidelines</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column gap-2 mb-3 p-3 border rounded bg-light">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div className="small fw-bold text-muted">CURRENT FILE</div>
              <div className="fw-semibold">{guidelineInfo?.fileName || 'No guideline file uploaded'}</div>
            </div>
            {guidelineInfo?.fileUrl ? (
              <Button
                variant="outline-primary"
                size="sm"
                type="button"
                onClick={onDownloadGuideline}
                className="d-inline-flex align-items-center gap-2"
              >
                <Download size={14} /> Download
              </Button>
            ) : null}
          </div>
          <div className="small text-muted">
            {fileSizeText}
            {guidelineInfo?.contentType ? ` · ${guidelineInfo.contentType}` : ''}
          </div>
          {guidelineFile ? (
            <div className="small text-success fw-semibold">Selected file: {guidelineFile.name}</div>
          ) : null}
        </div>

        {isEditing ? (
          <div className="d-flex flex-column gap-2">
            <label className="small fw-bold text-muted">EDIT CONTENT</label>
            <Form.Control as="textarea" rows={10} value={guidelinesText} onChange={(e) => setGuidelinesText(e.target.value)} placeholder="Enter detailed instructions..." />
            <div className="d-flex flex-column gap-2 mt-2">
              <label className="small fw-bold text-muted">UPLOAD REPLACEMENT FILE</label>
              <Form.Control
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx,.rtf,text/plain,application/pdf"
                onChange={onGuidelineFileSelect}
              />
              <div className="small text-muted">
                If you upload a file, it will replace the current guideline. Otherwise the text content is saved as a .txt file.
              </div>
            </div>
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
            <Button variant="primary" onClick={onSave} disabled={isSaving} className="d-flex align-items-center gap-2">
              <Upload size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
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
  guidelineInfo: PropTypes.shape({
    fileName: PropTypes.string,
    fileSize: PropTypes.number,
    contentType: PropTypes.string,
    fileUrl: PropTypes.string,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  guidelineFile: PropTypes.shape({
    name: PropTypes.string,
  }),
  onGuidelineFileSelect: PropTypes.func,
  onDownloadGuideline: PropTypes.func,
  isSaving: PropTypes.bool,
  onSave: PropTypes.func,
};

export default GuidelinesModal;
