const Loader = () => {
    return (
        <div className="flex flex-col justify-center items-center py-24">
            {/* Futuristic Spinner Container */}
            <div className="relative flex justify-center items-center w-16 h-16 mb-8">
                {/* Static background track */}
                <div className="absolute inset-0 rounded-full border border-gray-800/50"></div>
                
                {/* Outer cyan spinning ring with glow */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 border-r-cyan-500/30 animate-spin shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]"></div>
                
                {/* Inner indigo reverse spinning ring */}
                <div className="absolute inset-2.5 rounded-full border-2 border-transparent border-b-indigo-500 border-l-indigo-500/30 animate-[spin_1.2s_linear_infinite_reverse]"></div>
                
                {/* Center glowing data core */}
                <div className="w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_12px_rgba(6,182,212,1)] animate-ping opacity-80"></div>
                <div className="absolute w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            
            {/* Status Text */}
            <div className="flex flex-col items-center gap-2">
                <h3 className="text-sm font-mono font-medium text-cyan-400 uppercase tracking-widest animate-pulse">
                    Fetching the latest articles...
                </h3>
                
                {/* Simulated system console sub-text */}
                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
                    Establishing secure neural link _
                </p>
            </div>
        </div>
    );
};

export default Loader;