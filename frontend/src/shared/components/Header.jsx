import React from 'react';
import { SearchBar } from './SearchBar';
import { NotificationDropdown } from './NotificationDropdown';

export const Header = () => {
    return (
        <header className="bg-white border-bottom sticky-top" style={{ zIndex: 1040 }}>
            <div className="container-fluid px-4 py-3">
                <div className="d-flex align-items-center justify-content-between gap-3">
                    {/* Logo/Brand */}
                    <div className="d-flex align-items-center gap-3">
                        <h5 className="mb-0 fw-bold text-primary d-none d-md-block">
                            LabelNexus
                        </h5>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-grow-1 d-none d-md-block">
                        <SearchBar />
                    </div>

                    {/* Right Side Actions */}
                    <div className="d-flex align-items-center gap-2">
                        {/* Mobile Search Toggle */}
                        <div className="d-md-none">
                            <SearchBar />
                        </div>

                        {/* Notifications */}
                        <NotificationDropdown />

                        {/* User Avatar/Menu can be added here */}
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="d-md-none mt-3">
                    <SearchBar />
                </div>
            </div>
        </header>
    );
};
