import React, { useState, useRef, useEffect } from 'react';
import { Loader, ZoomIn, ZoomOut } from 'lucide-react';

export const AnnotationCanvas = ({ 
    imageUrl,
    annotations = [],
    showAnnotations = true,
    isLoading = false,
    readOnly = true
}) => {
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const panStartRef = useRef(null);

    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Reset when image changes
    useEffect(() => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    }, [imageUrl]);

    // Zoom handlers
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 5));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

    // Pan handlers
    const handlePanStart = (e) => {
        // Allow panning with: left click (always), middle mouse, or Shift/Space + left click
        if (e.button === 0 || e.button === 1 || (e.button === 0 && (e.shiftKey || isSpacePressed))) {
            e.preventDefault();
            setIsPanning(true);
            panStartRef.current = {
                x: e.clientX - panOffset.x,
                y: e.clientY - panOffset.y
            };
        }
    };

    const handlePanMove = (e) => {
        if (isPanning && panStartRef.current) {
            e.preventDefault();
            setPanOffset({
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y
            });
        }
    };

    const handlePanEnd = () => {
        setIsPanning(false);
        panStartRef.current = null;
    };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomLevel(prev => Math.max(0.25, Math.min(5, prev + delta)));
        }
    };

    // Keyboard handlers for space key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !isSpacePressed && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsSpacePressed(false);
                if (isPanning) {
                    setIsPanning(false);
                    panStartRef.current = null;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacePressed, isPanning]);

    return (
        <div className="d-flex flex-column flex-grow-1">
            {/* Toolbar */}
            <div style={{ 
                padding: '0.5rem 1rem', 
                borderBottom: '1px solid #e5e7eb', 
                backgroundColor: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <button
                    onClick={handleZoomIn}
                    title="Zoom In"
                    style={{
                        padding: '0.375rem 0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ZoomIn size={18} />
                </button>
                <span className="text-muted" style={{ fontSize: '0.75rem', minWidth: '3rem', textAlign: 'center' }}>
                    {Math.round(zoomLevel * 100)}%
                </span>
                <button
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    style={{
                        padding: '0.375rem 0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ZoomOut size={18} />
                </button>
                <button
                    onClick={handleResetZoom}
                    title="Reset Zoom"
                    style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.375rem 0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    1:1
                </button>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                style={{
                    cursor: isPanning ? 'grabbing' : 'grab',
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    width: '100%',
                    height: '100%'
                }}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
                onWheel={handleWheel}
            >
                {isLoading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center">
                        <Loader className="spinner" size={40} style={{ color: '#6366f1' }} />
                        <p className="text-muted mt-2">Loading...</p>
                    </div>
                ) : (
                    <div
                        style={{
                            transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoomLevel})`,
                            transformOrigin: 'center center',
                            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                            position: 'absolute',
                            top: '50%',
                            left: '50%'
                        }}
                    >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                ref={imageRef}
                                src={imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'}
                                alt="Annotation canvas"
                                draggable={false}
                                onError={(e) => { 
                                    e.target.src = 'https://via.placeholder.com/800x600?text=Image+Error'; 
                                }}
                                style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />

                            {/* Annotations */}
                            {showAnnotations && annotations.map((ann) => {
                                const coords = ann.coordinates;
                                const coordType = coords?.type || (coords?.points ? 'polygon' : 'bbox');
                                
                                // Use natural dimensions (same as annotator)
                                const img = imageRef.current;
                                const imgWidth = img?.naturalWidth || img?.width || 1;
                                const imgHeight = img?.naturalHeight || img?.height || 1;

                                // Debug logging
                                console.log('AnnotationCanvas - Rendering annotation:', {
                                    id: ann.id,
                                    coords,
                                    naturalWidth: img?.naturalWidth,
                                    naturalHeight: img?.naturalHeight,
                                    displayedWidth: img?.width,
                                    displayedHeight: img?.height,
                                    imgWidth,
                                    imgHeight
                                });

                                const boxColor = ann.labelColor || '#6366f1';

                                // Bbox
                                if (coordType === 'bbox' && coords?.points && coords.points.length === 2) {
                                    const [p1, p2] = coords.points;
                                    const x1 = Math.min(p1.x, p2.x) * imgWidth / 100;
                                    const y1 = Math.min(p1.y, p2.y) * imgHeight / 100;
                                    const x2 = Math.max(p1.x, p2.x) * imgWidth / 100;
                                    const y2 = Math.max(p1.y, p2.y) * imgHeight / 100;
                                    const width = x2 - x1;
                                    const height = y2 - y1;

                                    return (
                                        <div
                                            key={ann.id}
                                            style={{
                                                position: 'absolute',
                                                border: `2px solid ${boxColor}`,
                                                left: x1,
                                                top: y1,
                                                width: width,
                                                height: height,
                                                backgroundColor: `${boxColor}15`,
                                                pointerEvents: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    backgroundColor: boxColor,
                                                    color: '#fff',
                                                    padding: '0.125rem 0.375rem',
                                                    fontSize: '0.625rem',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {ann.labelName || 'Unknown'}
                                                {ann.confidence && (
                                                    <span style={{ opacity: 0.8, fontWeight: 'normal', marginLeft: '0.25rem' }}>
                                                        {(ann.confidence * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                // Polygon
                                if (coordType === 'polygon' && coords?.points && coords.points.length > 0) {
                                    const points = coords.points.map(p => ({
                                        x: p.x * imgWidth / 100,
                                        y: p.y * imgHeight / 100
                                    }));

                                    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                                    const highestPoint = points.reduce((min, p) => (p.y < min.y ? p : min), points[0]);

                                    return (
                                        <div key={ann.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                                                <polygon
                                                    points={pointsStr}
                                                    fill={`${boxColor}15`}
                                                    stroke={boxColor}
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: highestPoint.x,
                                                    top: highestPoint.y,
                                                    transform: 'translateY(-100%)',
                                                    backgroundColor: boxColor,
                                                    color: '#fff',
                                                    padding: '0.125rem 0.375rem',
                                                    fontSize: '0.625rem',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {ann.labelName || 'Unknown'}
                                                {ann.confidence && (
                                                    <span style={{ opacity: 0.8, fontWeight: 'normal', marginLeft: '0.25rem' }}>
                                                        {(ann.confidence * 100).toFixed(0)}%
                                                    </span>
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
        </div>
    );
};
