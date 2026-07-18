import type { BriefingSection as BriefingSectionType } from '../../types/news';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface BriefingSectionProps {
    section: BriefingSectionType;
}

const BriefingSection = ({ section }: BriefingSectionProps) => {
    return (
        <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
                <Badge variant="primary">{section.topic}</Badge>
            </div>
            
            <p className="text-[15px] leading-relaxed text-text mb-6">
                {section.summary}
            </p>

            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-2">Sources</h4>
                {section.articles.map((article, index) => (
                    <a
                        key={index}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <div className="p-3 rounded-lg bg-surface border border-border/50 hover:border-border-strong hover:bg-elevated transition-colors">
                            <h5 className="text-sm font-medium text-text group-hover:text-primary transition-colors line-clamp-1">
                                {article.title}
                            </h5>
                            <p className="text-xs text-muted mt-1">
                                {article.sourceName || article.source?.name || 'News Source'}
                            </p>
                        </div>
                    </a>
                ))}
            </div>
        </Card>
    );
};

export default BriefingSection;
