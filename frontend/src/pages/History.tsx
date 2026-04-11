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
        <div className="p-5 max-w-3xl mx-auto">
            <h2>Your Search History</h2>
            
            {loading && <p>Loading past searches...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && history.length === 0 && (
                <p>You haven't searched for anything yet!</p>
            )}

            {!loading && history.length > 0 && (
                <table className="w-full border-collapse mt-5">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-black">
                            <th className="p-2.5 text-left">Search Query</th>
                            <th className="p-2.5 text-left">Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((item, index) => (
                            <tr 
                                key={index} 
                                onClick={() => handleRowClick(item.query)} 
                                className="border-b border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <td className="p-2.5 font-bold text-blue-500">
                                    {item.query}
                                </td>
                                <td className="p-2.5">
                                    {new Date(item.timestamp).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default History;