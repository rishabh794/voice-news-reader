import type { FormEvent } from 'react';
import Button from './Button';

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    onSearch: (event: FormEvent) => void;
    loading: boolean;
    hasSummary?: boolean;
    onSummaryClick?: () => void;
}

const SearchBar = ({
    query,
    setQuery,
    onSearch,
    loading,
    hasSummary = false,
    onSummaryClick
}: SearchBarProps) => {
    return (
        <form
            onSubmit={onSearch}
            className="rounded-xl border border-border/70 bg-surface/90 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                    <label htmlFor="dashboard-search" className="sr-only">
                        Search topics
                    </label>
                    <input
                        id="dashboard-search"
                        type="text"
                        placeholder="Search niche markets, industries, or topics"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-full bg-transparent text-[15px] text-text placeholder:text-subtle focus-visible:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button type="submit" variant="primary" size="md" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                    {hasSummary && onSummaryClick && (
                        <Button type="button" variant="outline" size="md" onClick={onSummaryClick}>
                            Summary
                        </Button>
                    )}
                </div>
            </div>
        </form>
    );
};

export default SearchBar;
