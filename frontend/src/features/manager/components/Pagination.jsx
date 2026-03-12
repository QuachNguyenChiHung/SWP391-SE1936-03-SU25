import React from 'react';
import PropTypes from 'prop-types';

// Props:
// - page: number
// - totalPages: number
// - onChange: func(page)
const Pagination = ({ page, totalPages, onChange }) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <nav>
      <ul className="pagination">
        {pages.map(p => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}><button className="page-link" onClick={() => onChange?.(p)}>{p}</button></li>
        ))}
      </ul>
    </nav>
  );
};

Pagination.propTypes = {
  page: PropTypes.number,
  totalPages: PropTypes.number,
  onChange: PropTypes.func,
};

export default Pagination;
