const HistoryLoadingState = () => {
    return (
        <div className="flex items-center gap-3 p-4 bg-[#13131a] border border-gray-800/50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse"></span>
            <p className="text-gray-400 font-mono text-sm">Retrieving historical briefings...</p>
        </div>
    );
};

export default HistoryLoadingState;