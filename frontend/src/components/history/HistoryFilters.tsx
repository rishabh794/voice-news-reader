import type { HistoryCategory } from '../../types/news';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface HistoryFiltersProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    activeCategory: 'All' | HistoryCategory;
    categories: Array<'All' | HistoryCategory>;
    onCategoryChange: (category: 'All' | HistoryCategory) => void;
}

const HistoryFilters = ({
    searchTerm,
    onSearchTermChange,
    activeCategory,
    categories,
    onCategoryChange
}: HistoryFiltersProps) => {
    return (
        <div className="mb-6 space-y-3">
            <Input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Search topics, summaries, or sources"
                label="Search"
            />

            <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                    const isActive = activeCategory === category;
                    return (
                        <Button
                            key={category}
                            type="button"
                            onClick={() => onCategoryChange(category)}
                            variant={isActive ? 'secondary' : 'ghost'}
                            size="sm"
                            className={[
                                'rounded-full text-[11px] font-mono uppercase tracking-wider',
                                isActive ? 'text-text' : 'text-muted'
                            ].join(' ')}
                        >
                            {category}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryFilters;