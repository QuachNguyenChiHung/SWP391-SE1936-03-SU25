import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, Tag, Trash2 } from 'lucide-react';

// Props:
// - project: object
// - onClick: func(project)
// - onDelete: func(projectId, e)
const ProjectItem = ({ project, onClick, onDelete }) => {
  const progress = project.totalItems > 0 ? Math.round((project.finishedItems / project.totalItems) * 100) : 0;

  return (
    <div className="col-12 col-md-6 col-xl-4">
      <div
        onClick={() => onClick?.(project)}
        className="card h-100 border-0 bg-white"
        style={{ borderRadius: '16px', cursor: 'pointer' }}
      >
        <div className="card-body p-4 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="p-2 rounded-3" style={{ backgroundColor: project.type === 'IMAGE_BOUNDING_BOX' ? '#eff6ff' : '#f5f3ff', color: project.type === 'IMAGE_BOUNDING_BOX' ? '#2563eb' : '#7c3aed' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" fill="currentColor"/></svg>
            </div>
            <div className="text-end">
              <span className="badge rounded-pill bg-light text-muted border px-2 py-1">{project.status}</span>
            </div>
          </div>

          <div className="mb-3">
            <h3 className="h6 fw-bold text-dark mb-2 text-truncate">{project.name}</h3>
            <h3 className="text-muted small mb-2">Id: {project.id}</h3>
            <p className="text-muted small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.6em', lineHeight: '1.3em' }}>{project.description}</p>
          </div>

          <div className="mt-auto">
            <div className='text-muted small mb-1 fw-medium'>
              <span>Type: {project.type === 'ObjectDetection' ? 'Object Detection' : project.type}</span>
            </div>
            <div className="d-flex justify-content-between text-muted small mb-1 fw-medium">
              <span>Progress</span>
              <span className="text-dark">{progress}% ({project.finishedItems}/{project.totalItems})</span>
            </div>
            <div className="progress" style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
              <div className="progress-bar" role="progressbar" style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#10b981' : '#4f46e5', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-top d-flex justify-content-between text-muted" style={{ fontSize: '0.8rem', flexDirection: 'column' }}>
            <div className="d-flex align-items-center gap-1">
              <Calendar size={14} />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="d-flex gap-3">
              <div className="d-flex align-items-center gap-1">
                <Calendar size={14} />
                <span>Deadline:{project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</span>
              </div>
              <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                <Tag size={13} />
                <span className="fw-medium">{project.classes?.length || 0} Labels</span>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-2">
            <button onClick={(e) => { e.stopPropagation(); onDelete?.(project.id, e); }} className="btn btn-sm btn-danger d-flex align-items-center gap-2">
              <Trash2 size={14} />
              <span className="d-none d-sm-inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ProjectItem.propTypes = {
  project: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  onDelete: PropTypes.func,
};

export default ProjectItem;
