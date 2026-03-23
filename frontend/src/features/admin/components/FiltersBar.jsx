import React from 'react';
import { Search } from 'lucide-react';
import { Button, Form, InputGroup } from 'react-bootstrap';

export const FiltersBar = (props) => {
    const {
        searchQuery = '',
        roleFilter = '',
        statusFilter = '',
    } = props;

    const onSearchChange = props.onSearchChange || props.setSearchQuery || (() => { });
    const onRoleChange = props.onRoleChange || props.setRoleFilter || (() => { });
    const onStatusChange = props.onStatusChange || props.setStatusFilter || (() => { });
    const onSearchSubmit = props.onSearchSubmit || props.onSearch || (() => { });
    const onClear = props.onClear || props.onClearFilters || (() => { });

    return (
        <div className="d-flex flex-column gap-3 p-3 border-bottom">
            <InputGroup>
                <InputGroup.Text className="bg-light" style={{ borderRight: "3px solid black" }}>
                    <Search size={16} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label="Search users"
                />
                <Button
                    variant="primary"
                    onClick={onSearchSubmit}
                    style={{ borderRadius: '0' }}
                    className="d-flex align-items-center gap-2 rounded-none"
                >
                    <Search size={16} /> Search
                </Button>
            </InputGroup>

            <div className="d-flex gap-2">
                <Form.Select
                    size="sm"
                    className="w-auto"
                    value={roleFilter}
                    onChange={(e) => onRoleChange(e.target.value)}
                    aria-label="Filter by role"
                >
                    <option value="">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Annotator">Annotator</option>
                </Form.Select>

                <Form.Select
                    size="sm"
                    className="w-auto"
                    value={statusFilter}
                    onChange={(e) => onStatusChange(e.target.value)}
                    aria-label="Filter by status"
                >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="PendingVerification">Pending Verification</option>
                    <option value="PendingApproval">Pending Approval</option>
                </Form.Select>

                {(roleFilter || statusFilter || searchQuery) && (
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onClear}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>
        </div>
    );
};
