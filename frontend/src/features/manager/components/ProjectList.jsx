import React from 'react';
import PropTypes from 'prop-types';
import ProjectItem from './ProjectItem';

// Props:
// - projects: array
// - onProjectClick: func(project)
// - onDelete: func(projectId, e)
const ProjectList = ({ projects, onProjectClick, onDelete }) => {
  return (
    <div className="row g-4">
      {projects?.map(p => (
        <ProjectItem key={p.id} project={p} onClick={onProjectClick} onDelete={onDelete} />
      ))}
    </div>
  );
};

ProjectList.propTypes = {
  projects: PropTypes.array,
  onProjectClick: PropTypes.func,
  onDelete: PropTypes.func,
};

export default ProjectList;
