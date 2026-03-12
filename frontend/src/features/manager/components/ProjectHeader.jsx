import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft } from 'lucide-react';

// Props:
// - project: object
// - onBack: func
const ProjectHeader = ({ project, onBack }) => {
  return (
    <div className="d-flex align-items-center gap-3 mb-2">
      <button className="btn btn-light border shadow-sm bg-white" onClick={onBack}>
        <ArrowLeft size={20} />
      </button>
      <div>
        <h2 className="h4 fw-bold text-dark mb-1">{project?.name}</h2>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small border-end pe-2 me-1">{project?.type}</span>
          {project?.deadline && (
            <span className="text-muted small ms-2">Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

ProjectHeader.propTypes = {
  project: PropTypes.object,
  onBack: PropTypes.func,
};

export default ProjectHeader;
