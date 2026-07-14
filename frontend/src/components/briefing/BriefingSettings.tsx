import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { useBriefingSettings } from '../../hooks/useBriefingSettings';

const BriefingSettings = () => {
    const { settings, isLoading, updateSettings, isUpdating } = useBriefingSettings();
    const { showToast } = useToast();
    const [enabled, setEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);

    useEffect(() => {
        if (settings) {
            setEnabled(settings.enabled);
            setEmailEnabled(settings.emailEnabled);
        }
    }, [settings]);

    const handleSave = async () => {
        try {
            await updateSettings({ enabled, emailEnabled });
            showToast('Briefing settings saved successfully.', 'success');
        } catch (error) {
            showToast('Failed to save settings. Please try again.', 'error');
        }
    };

    if (isLoading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="h-6 w-32 bg-elevated rounded mb-4"></div>
                <div className="h-4 w-64 bg-elevated rounded mb-8"></div>
                <div className="h-10 w-24 bg-elevated rounded"></div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-display text-text mb-2">Briefing Settings</h3>
            <p className="text-sm text-muted mb-6">
                Configure your daily personalized news briefing.
            </p>

            <div className="space-y-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-elevated'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>
                    <div>
                        <div className="text-[15px] font-medium text-text group-hover:text-primary transition-colors">
                            Enable Daily Briefings
                        </div>
                        <div className="text-sm text-muted mt-1">
                            Generate a customized audio briefing every morning based on your topic preferences.
                        </div>
                    </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={emailEnabled}
                            onChange={(e) => setEmailEnabled(e.target.checked)}
                            disabled={!enabled}
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${!enabled ? 'bg-border/50 opacity-50' : emailEnabled ? 'bg-primary' : 'bg-elevated'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${emailEnabled && enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>
                    <div className={!enabled ? 'opacity-50' : ''}>
                        <div className="text-[15px] font-medium text-text group-hover:text-primary transition-colors">
                            Email Delivery
                        </div>
                        <div className="text-sm text-muted mt-1">
                            Receive your daily briefing script directly in your inbox.
                        </div>
                    </div>
                </label>
            </div>

            <div className="mt-8 pt-6 border-t border-border/70 flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isUpdating || (settings?.enabled === enabled && settings?.emailEnabled === emailEnabled)}
                >
                    {isUpdating ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </Card>
    );
};

export default BriefingSettings;
