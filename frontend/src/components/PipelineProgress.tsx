import type { PipelineStage } from '../hooks/useSSESearch';


interface PipelineProgressProps {
    stage: PipelineStage;
    intentTopic: string | null;
    optimizedQuery?: string;
    articleCount: number;
    category: string;
}

const PipelineProgress = ({ stage, intentTopic, optimizedQuery, articleCount, category }: PipelineProgressProps) => {
    if (stage === 'idle' || stage === 'complete' || stage === 'error') {
        return null;
    }

    const getStatus = (index: number) => {
        const stages = ['connecting', 'intent', 'query_optimized', 'articles', 'summary', 'category'];
        const currentIndex = stages.indexOf(stage);
        
        if (currentIndex > index) return 'done';
        if (currentIndex === index) return 'active';
        return 'pending';
    };

    const renderItem = (status: string, activeText: string, doneText: string, pendingText: string) => {
        if (status === 'done') {
            return (
                <div className="flex items-center gap-2 text-sm text-green-500 animate-in fade-in">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{doneText}</span>
                </div>
            );
        }
        
        if (status === 'active') {
            return (
                <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                    <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                        <span className="w-2 h-2 bg-primary rounded-full animate-ping absolute"></span>
                        <span className="w-2 h-2 bg-primary rounded-full relative"></span>
                    </span>
                    <span>{activeText}</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 text-sm text-muted opacity-50">
                <span className="w-4 h-4 shrink-0 rounded-full border border-muted"></span>
                <span>{pendingText}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 p-4 mb-6 rounded-lg bg-surface border border-border">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Analyzing Request</h3>
            
            <div className="flex flex-col gap-3">
                {renderItem(
                    getStatus(1), 
                    'Detecting intent...', 
                    `Intent detected: "${intentTopic}"`, 
                    'Detecting intent'
                )}

                {renderItem(
                    getStatus(2),
                    'Optimizing search query...',
                    `Query optimized: ${optimizedQuery || intentTopic}`,
                    'Optimizing query'
                )}
                
                {renderItem(
                    getStatus(3), 
                    'Fetching latest articles...', 
                    `${articleCount} articles fetched`, 
                    'Fetching articles'
                )}
                
                {renderItem(
                    getStatus(4), 
                    'Synthesizing summary...', 
                    'Summary generated', 
                    'Synthesizing summary'
                )}
                
                {renderItem(
                    getStatus(5), 
                    'Classifying topic...', 
                    `Categorized as ${category}`, 
                    'Classifying topic'
                )}
            </div>
        </div>
    );
};

export default PipelineProgress;
