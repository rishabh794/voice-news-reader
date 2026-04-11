import React from 'react';

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    onSearch: (e: React.FormEvent) => void;
    loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch, loading }) => {
    return (
        <form onSubmit={onSearch} className="mb-8 flex gap-2.5">
            <input 
                type="text" 
                placeholder="Search for news..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="p-2.5 w-[300px] border border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button 
                type="submit" 
                disabled={loading} 
                className="p-2.5 border border-black cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Searching...' : 'Search'}
            </button>
        </form>
    );
};

export default SearchBar;