import { useState } from 'react';
import { Loader2, Settings, Calendar, Newspaper } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useBriefing } from '../hooks/useBriefing';
import BriefingDashboardLayout from '../components/briefing/BriefingDashboardLayout';
import BriefingSettings from '../components/briefing/BriefingSettings';
import BriefingHistoryList from '../components/briefing/BriefingHistoryList';

const BriefingPage = () => {
    const { briefing, isLoading, isGenerating, generateBriefing, audioPlayer } = useBriefing();
    const [activeTab, setActiveTab] = useState<'latest' | 'history' | 'settings'>('latest');

    const handleGenerate = async () => {
        try {
            await generateBriefing();
        } catch (error) {
            console.error('Failed to generate briefing:', error);
        }
    };

    const renderLatest = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            );
        }

        if (!briefing) {
            return (
                <EmptyState
                    title="No Briefing Available"
                    description="You don't have a briefing for today yet. Make sure your briefing settings are enabled and you have topics selected."
                    action={
                        <Button
                            variant="primary"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Briefing Now'
                            )}
                        </Button>
                    }
                />
            );
        }

        const dateObj = new Date(briefing.date + 'T00:00:00Z');
        const displayDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-4">
                    <div>
                        <h2 className="text-xl font-display text-text">Your Daily Briefing</h2>
                        <p className="text-muted">{displayDate}</p>
                    </div>
                </div>

                <BriefingDashboardLayout briefing={briefing} audioPlayer={audioPlayer} />
            </div>
        );
    };

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <PageHeader
                title="Daily Briefing"
                subtitle="Your personalized audio news summary, delivered every morning."
            />

            <div className="mt-8 border-b border-border/70">
                <div className="flex gap-6 -mb-px">
                    <button
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'latest'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted hover:text-text hover:border-border-strong'
                        }`}
                        onClick={() => setActiveTab('latest')}
                    >
                        <div className="flex items-center gap-2">
                            <Newspaper className="w-4 h-4" />
                            Latest Briefing
                        </div>
                    </button>
                    <button
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'history'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted hover:text-text hover:border-border-strong'
                        }`}
                        onClick={() => setActiveTab('history')}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Previous Briefings
                        </div>
                    </button>
                    <button
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'settings'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted hover:text-text hover:border-border-strong'
                        }`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Settings
                        </div>
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {activeTab === 'latest' && renderLatest()}
                {activeTab === 'history' && <BriefingHistoryList />}
                {activeTab === 'settings' && <BriefingSettings />}
            </div>
        </div>
    );
};

export default BriefingPage;
