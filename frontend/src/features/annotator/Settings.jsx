import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle } from 'lucide-react';

export const Settings = () => {
    const [settings, setSettings] = useState({
        autoSave: true,
        autoSaveInterval: 30,
        showKeyboardShortcuts: true,
        notificationsEnabled: true
    });
    const [showToast, setShowToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('annotatorSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(parsed);
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('annotatorSettings', JSON.stringify(settings));
        
        // Simulate save delay for better UX
        setTimeout(() => {
            setIsSaving(false);
            setShowToast(true);
            
            // Hide toast after 3 seconds
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        }, 500);
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex align-items-center gap-2 mb-4">
                <SettingsIcon size={24} className="text-primary" />
                <h2 className="fw-bold mb-0">Settings</h2>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <h5 className="fw-bold mb-4">Workspace Preferences</h5>
                    
                    <div className="mb-4">
                        <div className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={settings.autoSave}
                                onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                            />
                            <label className="form-check-label">Enable Auto-Save</label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Auto-Save Interval (seconds)</label>
                        <input 
                            type="number" 
                            className="form-control" 
                            value={settings.autoSaveInterval}
                            onChange={(e) => setSettings({...settings, autoSaveInterval: parseInt(e.target.value)})}
                            min="10"
                            max="300"
                        />
                    </div>

                    <div className="mb-4">
                        <div className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={settings.showKeyboardShortcuts}
                                onChange={(e) => setSettings({...settings, showKeyboardShortcuts: e.target.checked})}
                            />
                            <label className="form-check-label">Show Keyboard Shortcuts</label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="form-check form-switch">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={settings.notificationsEnabled}
                                onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
                            />
                            <label className="form-check-label">Enable Notifications</label>
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary d-flex align-items-center gap-2" 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
                    <div className="toast show" role="alert">
                        <div className="toast-body d-flex align-items-center gap-2 bg-success text-white rounded">
                            <CheckCircle size={20} />
                            <span>Settings saved successfully!</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .toast {
                    min-width: 250px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .toast-body {
                    padding: 12px 16px;
                }
            `}</style>
        </div>
    );
};
