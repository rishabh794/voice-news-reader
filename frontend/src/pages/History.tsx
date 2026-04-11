import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import API from '../services/api';

const History = () => {
    const [history, setHistory] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await API.get('/history');
                setHistory(response.data);
            } catch (err) {
                setError('Failed to load history.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // The click handler that packs the bag
    const handleRowClick = (searchQuery: string) => {
        navigate('/dashboard', { 
            state: { query: searchQuery, fromHistory: true } 
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 p-6 pt-10 bg-[#0d0d12] border border-gray-800/80 rounded-xl font-sans text-gray-200">
            
            {/* Header section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/60">
                <div className="w-1.5 h-6 bg-cyan-600 rounded-sm"></div>
                <h2 className="text-xl font-medium text-gray-100 font-mono uppercase tracking-wide">
                    Query_Log
                </h2>
            </div>
            
            {/* System Status States */}
            {loading && (
                <div className="flex items-center gap-3 p-4 bg-[#13131a] border border-gray-800/50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse"></span>
                    <p className="text-gray-400 font-mono text-sm">Retrieving historical data...</p>
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 text-sm font-mono flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <p>{error}</p>
                </div>
            )}

            {!loading && history.length === 0 && !error && (
                <div className="p-8 text-center bg-[#13131a] border border-gray-800/50 rounded-lg">
                    <p className="text-gray-500 font-mono text-sm">No previous voice commands logged in this session.</p>
                </div>
            )}

            {/* Data Table */}
            {!loading && history.length > 0 && (
                <div className="overflow-hidden border border-gray-800/80 rounded-lg bg-[#0d0d12]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#13131a] border-b border-gray-800/80">
                                <th className="p-4 text-xs font-mono text-cyan-600 uppercase tracking-wider font-medium w-2/3">
                                    Search Query
                                </th>
                                <th className="p-4 text-xs font-mono text-gray-500 uppercase tracking-wider font-medium w-1/3">
                                    Date & Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {history.map((item, index) => (
                                <tr 
                                    key={index} 
                                    onClick={() => handleRowClick(item.query)} 
                                    className="group cursor-pointer hover:bg-[#16161f] transition-colors duration-200"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-600 font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                &gt;
                                            </span>
                                            <span className="font-mono text-gray-300 group-hover:text-cyan-400 transition-colors">
                                                {item.query}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 font-mono">
                                        {new Date(item.timestamp).toLocaleString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default History;