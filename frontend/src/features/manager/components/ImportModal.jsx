import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { Image as ImageIcon, X } from 'lucide-react';

// Props:
// - isOpen, onHide, uploadProgress, selectedFiles, onFileSelect, removeSelectedFile, handleImport, clearSelectedFiles
const ImportModal = ({ isOpen, onHide, uploadProgress, selectedFiles, onFileSelect, removeSelectedFile, handleImport, clearSelectedFiles }) => {
  return (
    <Modal show={isOpen} onHide={() => !uploadProgress && onHide(false)} centered size="lg">
      <Modal.Header closeButton={!uploadProgress} />
      <Modal.Body>
        {uploadProgress > 0 ? (
          <div className="text-center py-4">
            <h5 className="mb-3">Uploading Files...</h5>
            <p className="text-muted small">{uploadProgress}% Complete</p>
            <ProgressBar now={uploadProgress} striped variant="primary" animated className="mx-auto" style={{ maxWidth: '300px' }} />
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            <div className="border border-2 border-dashed rounded p-5 text-center bg-light position-relative">
              <input type="file" multiple accept="image/*" onChange={onFileSelect} className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" />
              <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3 mb-2 text-primary">
                <ImageIcon size={24} />
              </div>
              <p className="mb-0 fw-medium">Drag & Drop or Click to Upload</p>
              <small className="text-muted">Support JPG, PNG, JPEG (Max 10MB)</small>
            </div>
            {selectedFiles.length > 0 && (
              <div className="border rounded">
                <div className="p-2 bg-light border-bottom d-flex justify-content-between align-items-center">
                  <small className="fw-bold">Selected Files ({selectedFiles.length})</small>
                  <Button variant="link" className="text-danger p-0 text-decoration-none small" onClick={clearSelectedFiles}>Clear All</Button>
                </div>
                <div className="p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center p-2 border-bottom last-border-0">
                      <div className="d-flex align-items-center gap-2 text-truncate">
                        <img src={URL.createObjectURL(f)} width="30" height="30" className="rounded object-fit-cover" />
                        <div>
                          <div className="small fw-medium text-truncate" style={{ maxWidth: '200px' }}>{f.name}</div>
                          <div className="small text-muted" style={{ fontSize: '10px' }}>{(f.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <Button variant="link" className="text-muted p-0" onClick={() => removeSelectedFile(i)}><X size={16} /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={() => onHide(false)} disabled={uploadProgress > 0}>Cancel</Button>
        <Button variant="primary" onClick={handleImport} disabled={selectedFiles.length === 0 || uploadProgress > 0}>{uploadProgress > 0 ? 'Uploading...' : `Upload ${selectedFiles.length} Images`}</Button>
      </Modal.Footer>
    </Modal>
  );
};

ImportModal.propTypes = {
  isOpen: PropTypes.bool,
  onHide: PropTypes.func,
  uploadProgress: PropTypes.number,
  selectedFiles: PropTypes.array,
  onFileSelect: PropTypes.func,
  removeSelectedFile: PropTypes.func,
  handleImport: PropTypes.func,
  clearSelectedFiles: PropTypes.func,
};

export default ImportModal;
