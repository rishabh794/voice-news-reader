import React from 'react';

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    onSearch: (e: React.FormEvent) => void;
    loading: boolean;
    hasSummary?: boolean;
    onSummaryClick?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    query,
    setQuery,
    onSearch,
    loading,
    hasSummary = false,
    onSummaryClick
}) => {
    return (
        <form 
            onSubmit={onSearch} 
            className="relative flex w-full max-w-2xl mx-auto mb-10 bg-[#0d0d12]/90 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-1.5 shadow-[0_0_30px_-15px_rgba(6,182,212,0.15)] focus-within:border-cyan-500/50 focus-within:shadow-[0_0_30px_-10px_rgba(6,182,212,0.25)] transition-all duration-300"
        >
            {/* Terminal prompt symbol */}
            <div className="flex items-center justify-center pl-5 pr-2 text-cyan-500 font-mono text-lg font-bold">
                <span className="animate-pulse">&gt;</span>
            </div>

            <input 
                type="text" 
                placeholder="Enter voice command or search query..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 w-full bg-transparent border-none px-2 py-3 text-gray-200 font-mono text-sm placeholder-gray-600 focus:outline-none focus:ring-0"
            />
            
            <button 
                type="submit" 
                disabled={loading} 
                className="relative group overflow-hidden px-6 py-3 bg-[#13131a] border border-cyan-500/30 rounded-xl text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-cyan-400"
            >
                {/* Button Hover Glow Effect */}
                {!loading && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[inset_0_0_20px_rgba(6,182,212,0.3)] transition-opacity duration-300"></div>
                    </>
                )}
                
                <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                        <>
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                            Processing_
                        </>
                    ) : (
                        'Execute'
                    )}
                </span>
            </button>

            {hasSummary && onSummaryClick && (
                <button
                    type="button"
                    onClick={onSummaryClick}
                    className="ml-2 px-4 py-3 bg-[#13131a] border border-indigo-500/30 rounded-xl text-indigo-300 font-mono text-xs font-bold uppercase tracking-widest hover:text-white hover:border-indigo-400/50 transition-all duration-300"
                >
                    Summary
                </button>
            )}
        </form>
    );
};

export default SearchBar;
