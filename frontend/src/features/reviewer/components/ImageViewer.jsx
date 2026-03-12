import React from 'react';
import PropTypes from 'prop-types';
import { Loader } from 'lucide-react';

const ImageViewer = React.forwardRef(({
    isLoadingDetail,
    task,
    showLabels,
    zoomLevel,
    panOffset,
    isPanning,
    isSpacePressed,
    containerRef,
    imageRef,
    onPanStart,
    onPanMove,
    onPanEnd,
    onWheel
}, ref) => {
    return (
        <div
            ref={containerRef}
            className="flex-fill bg-dark d-flex align-items-center justify-content-center position-relative overflow-hidden"
            style={{ cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default' }}
            onMouseDown={onPanStart}
            onMouseMove={onPanMove}
            onMouseUp={onPanEnd}
            onMouseLeave={onPanEnd}
            onWheel={onWheel}
        >
            {isLoadingDetail ? (
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <Loader className="spinner" size={40} style={{ color: '#fff' }} />
                    <p className="text-white mt-2">Loading review...</p>
                </div>
            ) : (
                <div
                    style={{
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                        position: 'relative',
                        display: 'inline-block'
                    }}
                >
                    <div className="position-relative" style={{ display: 'inline-block' }}>
                        <img
                            ref={imageRef}
                            src={task.imageUrl ? (task.imageUrl.startsWith('http') ? task.imageUrl : (import.meta.env.VITE_URL_UPLOADS + '/' + task.imageUrl)) : 'https://via.placeholder.com/800x600?text=No+Image'}
                            alt="Review"
                            className="mw-100 mh-100 object-fit-contain d-block"
                            draggable={false}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Image+Error'; }}
                        />

                        {showLabels && task.annotations.map((ann) => {
                            const coords = ann.coordinates;
                            const coordType = coords?.type || (coords?.points ? 'polygon' : 'bbox');

                            if (coordType === 'bbox' && coords?.points && coords.points.length === 2) {
                                const [p1, p2] = coords.points;
                                const x1 = Math.min(p1.x, p2.x);
                                const y1 = Math.min(p1.y, p2.y);
                                const x2 = Math.max(p1.x, p2.x);
                                const y2 = Math.max(p1.y, p2.y);
                                const width = x2 - x1;
                                const height = y2 - y1;
                                const labelAbove = y1 > 30;

                                return (
                                    <div key={ann.id}>
                                        <div
                                            className="position-absolute bg-white bg-opacity-10"
                                            style={{
                                                border: `2px solid ${ann.labelColor || '#000'}`,
                                                left: `${x1}px`,
                                                top: `${y1}px`,
                                                width: `${width}px`,
                                                height: `${height}px`,
                                                pointerEvents: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <div
                                            className="position-absolute px-2 py-1 fw-bold text-white rounded-top shadow-sm d-flex align-items-center gap-1 text-nowrap"
                                            style={{
                                                backgroundColor: ann.labelColor || '#000',
                                                left: `${x1}px`,
                                                top: `${labelAbove ? y1 : y1 + height}px`,
                                                transform: labelAbove ? 'translateY(-100%)' : 'none',
                                                fontSize: '10px',
                                                pointerEvents: 'none',
                                                zIndex: 10
                                            }}
                                        >
                                            <span>{ann.labelName || 'Unknown'}</span>
                                            {ann.confidence && (
                                                <span className="opacity-75 fw-normal ms-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            if (coordType === 'polygon' && coords?.points && coords.points.length > 0) {
                                const points = coords.points.map((p) => `${p.x},${p.y}`).join(' ');
                                const highestPoint = coords.points.reduce((min, p) => (p.y < min.y ? p : min), coords.points[0]);

                                return (
                                    <div key={ann.id}>
                                        <svg className="position-absolute" style={{ left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }} width="100%" height="100%">
                                            <polygon points={points} fill="rgba(255, 255, 255, 0.1)" stroke={ann.labelColor || '#000'} strokeWidth="2" />
                                        </svg>
                                        <div
                                            className="position-absolute px-2 py-1 fw-bold text-white rounded-top shadow-sm d-flex align-items-center gap-1 text-nowrap"
                                            style={{
                                                backgroundColor: ann.labelColor || '#000',
                                                left: `${highestPoint.x}px`,
                                                top: `${highestPoint.y}px`,
                                                transform: 'translateY(-100%)',
                                                fontSize: '10px',
                                                pointerEvents: 'none',
                                                zIndex: 10
                                            }}
                                        >
                                            <span>{ann.labelName || 'Unknown'}</span>
                                            {ann.confidence && (
                                                <span className="opacity-75 fw-normal ms-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            if (coords?.x !== undefined && coords?.y !== undefined && coords?.width !== undefined && coords?.height !== undefined) {
                                const labelAbove = coords.y > 30;
                                return (
                                    <div key={ann.id}>
                                        <div
                                            className="position-absolute bg-white bg-opacity-10"
                                            style={{
                                                border: `2px solid ${ann.labelColor || '#000'}`,
                                                left: `${coords.x}px`,
                                                top: `${coords.y}px`,
                                                width: `${coords.width}px`,
                                                height: `${coords.height}px`,
                                                pointerEvents: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <div
                                            className="position-absolute px-2 py-1 fw-bold text-white rounded-top shadow-sm d-flex align-items-center gap-1 text-nowrap"
                                            style={{
                                                backgroundColor: ann.labelColor || '#000',
                                                left: `${coords.x}px`,
                                                top: `${labelAbove ? coords.y : coords.y + coords.height}px`,
                                                transform: labelAbove ? 'translateY(-100%)' : 'none',
                                                fontSize: '10px',
                                                pointerEvents: 'none',
                                                zIndex: 10
                                            }}
                                        >
                                            <span>{ann.labelName || 'Unknown'}</span>
                                            {ann.confidence && (
                                                <span className="opacity-75 fw-normal ms-1">{(ann.confidence * 100).toFixed(0)}%</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});

ImageViewer.displayName = 'ImageViewer';

ImageViewer.propTypes = {
    isLoadingDetail: PropTypes.bool,
    task: PropTypes.object,
    showLabels: PropTypes.bool,
    zoomLevel: PropTypes.number,
    panOffset: PropTypes.object,
    isPanning: PropTypes.bool,
    isSpacePressed: PropTypes.bool,
    containerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    imageRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    onPanStart: PropTypes.func,
    onPanMove: PropTypes.func,
    onPanEnd: PropTypes.func,
    onWheel: PropTypes.func
};

ImageViewer.defaultProps = {
    isLoadingDetail: false,
    task: { annotations: [] },
    showLabels: true,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
    isPanning: false,
    isSpacePressed: false,
    containerRef: null,
    imageRef: null,
    onPanStart: () => { },
    onPanMove: () => { },
    onPanEnd: () => { },
    onWheel: () => { }
};

export default ImageViewer;
