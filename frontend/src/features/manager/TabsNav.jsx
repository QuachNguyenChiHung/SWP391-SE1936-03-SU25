import React from 'react';

export default function TabsNav({ tabs, activeTab, setActiveTab }) {
    return (
        <div className="border-bottom">
            <div className="d-flex gap-4">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`d-flex align-items-center gap-2 px-1 py-3 bg-transparent border-0 position-relative transition-all`}
                            style={{
                                cursor: 'pointer',
                                color: isActive ? '#0d6efd' : '#6c757d',
                                fontWeight: isActive ? '600' : '500',
                                marginBottom: '-1px'
                            }}
                        >
                            <Icon size={18} />
                            <span>{tab.id}</span>
                            {isActive && (
                                <div
                                    className="position-absolute bottom-0 start-0 w-100 bg-primary"
                                    style={{ height: '3px', borderTopLeftRadius: '3px', borderTopRightRadius: '3px' }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
