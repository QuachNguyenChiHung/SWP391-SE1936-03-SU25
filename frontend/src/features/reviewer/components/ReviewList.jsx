import React from 'react';
import PropTypes from 'prop-types';
import ReviewItem from './ReviewItem.jsx';

const ReviewList = ({ items, selectedIndex, onSelect }) => {
    return (
        <div className="overflow-auto" style={{ flex: '1', minHeight: '280px' }}>
            {items && items.length === 0 && (
                <div className="p-4 text-center text-muted">No items to review</div>
            )}
            {items && items.map((item, idx) => (
                <ReviewItem
                    key={item.id}
                    item={item}
                    isSelected={idx === selectedIndex}
                    onClick={() => onSelect(idx)}
                />
            ))}
        </div>
    );
};

ReviewList.propTypes = {
    items: PropTypes.array,
    selectedIndex: PropTypes.number,
    onSelect: PropTypes.func
};

ReviewList.defaultProps = {
    items: [],
    selectedIndex: 0,
    onSelect: () => { }
};

export default ReviewList;
