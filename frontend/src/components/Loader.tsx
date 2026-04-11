import React from 'react';

const Loader = () => {
    return (
        <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <h3 className="text-xl font-bold text-blue-600 animate-pulse">Fetching the latest articles...</h3>
        </div>
    );
};

export default Loader;