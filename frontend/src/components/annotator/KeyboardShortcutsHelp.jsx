import { X, Keyboard } from 'lucide-react';

export const KeyboardShortcutsHelp = ({ show, onClose }) => {
    if (!show) return null;

    const shortcuts = [
        {
            category: 'Navigation',
            items: [
                { keys: ['←', '→'], description: 'Previous / Next item' },
                { keys: ['Home'], description: 'First item' },
                { keys: ['End'], description: 'Last item' },
            ]
        },
        {
            category: 'Tools',
            items: [
                { keys: ['S'], description: 'Select tool' },
                { keys: ['B'], description: 'Box tool' },
                { keys: ['P'], description: 'Polygon tool' },
                { keys: ['Esc'], description: 'Cancel current action' },
            ]
        },
        {
            category: 'Actions',
            items: [
                { keys: ['Space'], description: 'Complete current item' },
                { keys: ['Delete'], description: 'Delete selected annotation' },
                { keys: ['Ctrl', 'Z'], description: 'Undo' },
                { keys: ['Ctrl', 'Y'], description: 'Redo' },
                { keys: ['Ctrl', 'S'], description: 'Save annotations' },
                { keys: ['Ctrl', 'C'], description: 'Copy annotation' },
                { keys: ['Ctrl', 'V'], description: 'Paste annotation' },
            ]
        },
        {
            category: 'View',
            items: [
                { keys: ['+'], description: 'Zoom in' },
                { keys: ['-'], description: 'Zoom out' },
                { keys: ['0'], description: 'Reset zoom' },
                { keys: ['F'], description: 'Fit to screen' },
                { keys: ['G'], description: 'Toggle grid' },
                { keys: ['H'], description: 'Toggle guidelines' },
            ]
        },
        {
            category: 'Labels',
            items: [
                { keys: ['1-9'], description: 'Select label by number' },
                { keys: ['Shift', '1-9'], description: 'Apply label to selected' },
            ]
        },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="d-flex align-items-center gap-2">
                        <Keyboard size={24} className="text-primary" />
                        <h5 className="mb-0 fw-bold">Keyboard Shortcuts</h5>
                    </div>
                    <button className="btn btn-link text-muted p-0" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="shortcuts-grid">
                        {shortcuts.map((section, idx) => (
                            <div key={idx} className="shortcuts-section">
                                <h6 className="shortcuts-category">{section.category}</h6>
                                <div className="shortcuts-list">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="shortcut-item">
                                            <div className="shortcut-keys">
                                                {item.keys.map((key, k) => (
                                                    <span key={k}>
                                                        <kbd className="kbd">{key}</kbd>
                                                        {k < item.keys.length - 1 && <span className="key-separator">+</span>}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="shortcut-description">{item.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <p className="text-muted small mb-0">
                        Press <kbd className="kbd">?</kbd> anytime to show this help
                    </p>
                </div>

                <style>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                        backdrop-filter: blur(4px);
                    }

                    .shortcuts-modal {
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        max-width: 800px;
                        width: 90%;
                        max-height: 90vh;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                    }

                    .modal-header {
                        padding: 24px;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .modal-body {
                        padding: 24px;
                        overflow-y: auto;
                        flex: 1;
                    }

                    .modal-footer {
                        padding: 16px 24px;
                        border-top: 1px solid #e2e8f0;
                        background: #f8fafc;
                        text-align: center;
                    }

                    .shortcuts-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 24px;
                    }

                    .shortcuts-section {
                        background: #f8fafc;
                        border-radius: 12px;
                        padding: 16px;
                    }

                    .shortcuts-category {
                        font-size: 14px;
                        font-weight: 700;
                        color: #1e293b;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .shortcuts-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .shortcut-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px;
                        background: white;
                        border-radius: 8px;
                        gap: 12px;
                    }

                    .shortcut-keys {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        flex-shrink: 0;
                    }

                    .kbd {
                        display: inline-block;
                        padding: 4px 8px;
                        font-size: 12px;
                        font-weight: 600;
                        line-height: 1;
                        color: #1e293b;
                        background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
                        border: 1px solid #cbd5e1;
                        border-radius: 6px;
                        box-shadow: 0 2px 0 #cbd5e1, 0 1px 2px rgba(0, 0, 0, 0.1);
                        font-family: 'Courier New', monospace;
                        min-width: 24px;
                        text-align: center;
                    }

                    .key-separator {
                        margin: 0 2px;
                        color: #64748b;
                        font-weight: 600;
                    }

                    .shortcut-description {
                        font-size: 13px;
                        color: #475569;
                        flex: 1;
                    }

                    @media (max-width: 768px) {
                        .shortcuts-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};
