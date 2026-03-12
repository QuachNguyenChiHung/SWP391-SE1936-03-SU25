import React from 'react';
import { Button } from 'react-bootstrap';

export const PaginationControls = ({
    pageNumber,
    totalPages,
    totalItems,
    pageSize,
    onPrev,
    onNext
}) => {
    const startItem = ((pageNumber - 1) * pageSize) + 1;
    const endItem = Math.min(pageNumber * pageSize, totalItems);

    return (
        <div className="d-flex justify-content-between align-items-center p-3">
            <div className="d-flex">
                <div className="text-muted small">
                    Showing {startItem} - {endItem} of {totalItems} users
                </div>

            </div>
            <div className="d-flex align-items-center gap-2 px-2">
                <span className="small">Page {pageNumber} of {totalPages}</span>
            </div>
            <div className="d-flex gap-2">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={pageNumber === 1}
                    onClick={onPrev}
                    aria-label="Previous page"
                >
                    Previous
                </Button>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={pageNumber >= totalPages}
                    onClick={onNext}
                    aria-label="Next page"
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
