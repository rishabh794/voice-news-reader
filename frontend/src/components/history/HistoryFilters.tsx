import type { HistoryCategory } from '../../types/news';

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
            <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Search topics, summaries, or sources..."
                className="w-full px-4 py-3 bg-[#11111a] border border-gray-700/80 rounded-lg text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60"
            />

            <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                    const isActive = activeCategory === category;
                    return (
                        <button
                            key={category}
                            type="button"
                            onClick={() => onCategoryChange(category)}
                            className={`px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-wider transition-all duration-200 ${
                                isActive
                                    ? 'bg-cyan-600/20 border-cyan-400/70 text-cyan-200'
                                    : 'bg-[#13131a] border-gray-700/80 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            }`}
                        >
                            {category}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryFilters;