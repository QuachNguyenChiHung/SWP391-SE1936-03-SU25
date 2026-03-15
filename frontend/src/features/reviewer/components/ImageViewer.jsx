import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    const internalContainerRef = useRef(null);

    const resolvedContainerRef = typeof containerRef === 'function' || (containerRef && containerRef.current) ? containerRef : internalContainerRef;

    const [localZoom, setLocalZoom] = useState(typeof zoomLevel === 'number' ? zoomLevel : 1);
    const [localPan, setLocalPan] = useState(panOffset ?? { x: 0, y: 0 });
    const [localIsPanning, setLocalIsPanning] = useState(!!isPanning);
    const [localIsSpacePressed, setLocalIsSpacePressed] = useState(!!isSpacePressed);

    // pointer tracking for drag and pinch
    const pointers = useRef(new Map());
    const lastPinch = useRef(null);
    const dragStart = useRef(null);
    const startPan = useRef({ x: 0, y: 0 });

    useEffect(() => { if (typeof zoomLevel === 'number') setLocalZoom(zoomLevel); }, [zoomLevel]);
    useEffect(() => { if (panOffset && typeof panOffset.x === 'number') setLocalPan(panOffset); }, [panOffset]);
    useEffect(() => { if (typeof isPanning === 'boolean') setLocalIsPanning(isPanning); }, [isPanning]);
    useEffect(() => { if (typeof isSpacePressed === 'boolean') setLocalIsSpacePressed(isSpacePressed); }, [isSpacePressed]);

    useEffect(() => {
        const down = (e) => {
            const tag = e.target && e.target.tagName;
            if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.target.isContentEditable) {
                setLocalIsSpacePressed(true);
                e.preventDefault();
            }
        };
        const up = (e) => {
            if (e.code === 'Space') {
                setLocalIsSpacePressed(false);
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    const clampZoom = useCallback((z) => Math.min(5, Math.max(0.1, z)), []);

    const getRect = (el) => el?.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };

    const handleWheelInternal = (e) => {
        if (onWheel && onWheel(e) === false) return;
        e.preventDefault();
        const rect = getRect(resolvedContainerRef.current);
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.12 : 0.88;
        const prevZoom = localZoom;
        const nextZoom = clampZoom(prevZoom * factor);
        const newPanX = mx - (mx - localPan.x) * (nextZoom / prevZoom);
        const newPanY = my - (my - localPan.y) * (nextZoom / prevZoom);
        setLocalZoom(nextZoom);
        setLocalPan({ x: newPanX, y: newPanY });
    };

    const handlePointerDown = (e) => {
        // start tracking this pointer
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, pointerType: e.pointerType });
        const el = resolvedContainerRef.current;
        try { el?.setPointerCapture?.(e.pointerId); } catch (err) { }

        if (pointers.current.size === 1) {
            // possible drag
            dragStart.current = { x: e.clientX, y: e.clientY };
            startPan.current = { ...localPan };
            // start panning when space is pressed or primary button
            const allowPan = localIsSpacePressed || e.button === 0 || e.buttons === 1 || e.pointerType === 'touch';
            if (allowPan) {
                setLocalIsPanning(true);
                if (onPanStart) onPanStart(e);
            }
        } else if (pointers.current.size === 2) {
            // initialize pinch
            const pts = Array.from(pointers.current.values());
            const dx = pts[0].x - pts[1].x;
            const dy = pts[0].y - pts[1].y;
            lastPinch.current = { dist: Math.hypot(dx, dy), center: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } };
        }
    };

    const handlePointerMove = (e) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, pointerType: e.pointerType });

        if (pointers.current.size === 1 && localIsPanning && dragStart.current) {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            const next = { x: startPan.current.x + dx, y: startPan.current.y + dy };
            setLocalPan(next);
            if (onPanMove) onPanMove(e);
        }

        if (pointers.current.size === 2) {
            const pts = Array.from(pointers.current.values());
            const dx = pts[0].x - pts[1].x;
            const dy = pts[0].y - pts[1].y;
            const dist = Math.hypot(dx, dy);
            const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
            if (lastPinch.current && lastPinch.current.dist > 0) {
                const prevZoom = localZoom;
                const nextZoom = clampZoom(prevZoom * (dist / lastPinch.current.dist));
                // adjust pan around center
                const rect = getRect(resolvedContainerRef.current);
                const mx = center.x - rect.left;
                const my = center.y - rect.top;
                const newPanX = mx - (mx - localPan.x) * (nextZoom / prevZoom);
                const newPanY = my - (my - localPan.y) * (nextZoom / prevZoom);
                setLocalZoom(nextZoom);
                setLocalPan({ x: newPanX, y: newPanY });
            }
            lastPinch.current = { dist, center };
        }
    };

    const handlePointerUp = (e) => {
        pointers.current.delete(e.pointerId);
        const el = resolvedContainerRef.current;
        try { el?.releasePointerCapture?.(e.pointerId); } catch (err) { }
        if (pointers.current.size === 0) {
            if (localIsPanning) {
                setLocalIsPanning(false);
                if (onPanEnd) onPanEnd(e);
            }
            dragStart.current = null;
            lastPinch.current = null;
        } else if (pointers.current.size === 1) {
            // reset pinch state
            lastPinch.current = null;
            // remaining pointer becomes drag start
            const remaining = Array.from(pointers.current.values())[0];
            dragStart.current = { x: remaining.x, y: remaining.y };
            startPan.current = { ...localPan };
        }
    };
    return (
        <div
            ref={resolvedContainerRef}
            tabIndex={0}
            className="flex-fill bg-dark d-flex align-items-center justify-content-center position-relative overflow-hidden"
            style={{ cursor: localIsPanning ? 'grabbing' : localIsSpacePressed ? 'grab' : 'default', touchAction: 'none', overscrollBehavior: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheelInternal}
            onWheelCapture={(e) => { try { e.preventDefault(); e.stopPropagation(); } catch (err) { } }}
        >
            {isLoadingDetail ? (
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <Loader className="spinner" size={40} style={{ color: '#fff' }} />
                    <p className="text-white mt-2">Loading review...</p>
                </div>
            ) : (
                <div
                    style={{
                        transform: `translate(${localPan.x}px, ${localPan.y}px) scale(${localZoom})`,
                        transformOrigin: 'center center',
                        transition: localIsPanning ? 'none' : 'transform 0.1s ease-out',
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
