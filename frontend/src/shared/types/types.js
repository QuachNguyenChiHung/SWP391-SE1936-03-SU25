// User roles enum as constants
export const UserRole = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    ANNOTATOR: 'Annotator',
    REVIEWER: 'Reviewer'
};

// Project status enum as constants
export const ProjectStatus = {
    Draft: 'Draft',
    Active: 'Active',
    Completed: 'Completed',
    Archived: 'Archived'
};

// Project type enum as constants (matches backend enum values)
export const ProjectType = {
    Classification: 1,
    ObjectDetection: 2,
    Segmentation: 3,
    Video: 4
};

// Data item status enum as constants
export const DataItemStatus = {
    NOT_ASSIGNED: 'NOT_ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    ESCALATED: 'ESCALATED'
};
