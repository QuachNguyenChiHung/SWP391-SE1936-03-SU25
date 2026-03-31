import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft } from 'lucide-react';
import api from '../../../shared/utils/api.js';
import { useAlert } from '../../../shared/context/AlertContext.jsx';
import { useUI } from '../../../shared/context/UIContext.jsx';
import { formatDateTime } from '../../../shared/utils/dateUtils.js';

const copy = {
  en: {
    export: 'Export (COCO, Approved Data items)',
    exporting: 'Exporting…',
    deadline: 'Deadline',
  },
  vi: {
    export: 'Xuat (COCO, du lieu da duyet)',
    exporting: 'Dang xuat…',
    deadline: 'Han chot',
  },
};

// Props:
// - project: object
// - onBack: func
const ProjectHeader = ({ project, onBack }) => {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const { showAlert } = useAlert();
  const { language } = useUI();
  const t = copy[language] || copy.en;

  const handleExport = useCallback(async () => {
    if (!project?.id) return;
    setExporting(true);
    try {
      const payload = {
        format: 'COCO',
        includeImages: true,
        statusFilter: 'Approved'
      };
      const res = await api.post(`/projects/${project.id}/export`, payload, { headers: { 'Content-Type': 'application/json' } });
      const data = res.data?.data ?? res.data;
      setExportResult(data);
      // open the download in a new tab if available
      if (data?.downloadUrl) {
        console.log('Opening download URL:', data.downloadUrl);
        const base = import.meta.env.VITE_URL
          ? String(import.meta.env.VITE_URL).replace(/\/api\/?$/, '')
          : window.location.origin;;
        let url = String(data.downloadUrl).startsWith('http') ? data.downloadUrl : `${base}${data.downloadUrl}`;
        url = url.replace('/api', '');
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error('Export failed', err);
      await showAlert('Export failed', 'Error', 'error');
    } finally {
      setExporting(false);
    }
  }, [project, showAlert]);

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
            <span className="text-muted small ms-2">
              {t.deadline}: {(() => {
                // Handle deadline that might be a string, object, or Date
                let deadlineStr = '';
                if (typeof project.deadline === 'object' && project.deadline !== null) {
                  deadlineStr = project.deadline.Deadline || project.deadline.deadline || '';
                } else {
                  deadlineStr = String(project.deadline);
                }
                return formatDateTime(deadlineStr);
              })()}
            </span>
          )}
        </div>
      </div>

      <div className="ms-auto d-flex align-items-center gap-2">
        <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
          {exporting ? t.exporting : t.export}
        </button>
      </div>
    </div>
  );
};

ProjectHeader.propTypes = {
  project: PropTypes.object,
  onBack: PropTypes.func,
};

export default ProjectHeader;
