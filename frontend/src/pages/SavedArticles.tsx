import { useEffect, useState } from 'react';
import API from '../services/api';
import Loader from '../components/Loader';
import NewsCard from '../components/NewsCard';
import type { Article, SavedArticle } from '../types/news';

const SavedArticles = () => {
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSavedArticles = async () => {
            try {
                const response = await API.get('/saved-articles');
                setSavedArticles(response.data as SavedArticle[]);
            } catch (err) {
                setError('Failed to load saved articles.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSavedArticles();
    }, []);

    const handleToggleSave = async (article: Article) => {
        const currentUrl = article.url;
        if (!currentUrl || pendingUrl === currentUrl) return;

        const saved = savedArticles.find((item) => item.url === currentUrl);
        if (!saved?._id) return;

        setPendingUrl(currentUrl);
        setError('');

        try {
            await API.delete(`/saved-articles/${saved._id}`);
            setSavedArticles((prev) => prev.filter((item) => item._id !== saved._id));
        } catch (err) {
            setError('Failed to remove article from saved list.');
            console.error(err);
        } finally {
            setPendingUrl(null);
        }
    };

    return (
        <div className="pt-20 px-5 pb-5 max-w-[1200px] mx-auto">
            <div className="mb-8 border border-gray-800/70 bg-[#0d0d12]/90 rounded-xl px-5 py-4">
                <h2 className="text-2xl text-cyan-400 font-mono uppercase tracking-wide">Saved Articles</h2>
                <p className="text-gray-400 text-sm mt-2 font-mono">Your personal reading list, synchronized across sessions.</p>
            </div>

            {error && <p className="text-red-500 font-bold mb-5">{error}</p>}

            {loading ? (
                <Loader />
            ) : savedArticles.length === 0 ? (
                <div className="border border-gray-800/70 bg-[#0d0d12]/90 rounded-xl px-5 py-8 text-center">
                    <p className="text-gray-400 font-mono text-sm">No saved articles yet. Save a headline from Dashboard to build your list.</p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                    {savedArticles.map((saved) => (
                        <NewsCard
                            key={saved._id}
                            article={{
                                _id: saved._id,
                                title: saved.title,
                                description: saved.description,
                                url: saved.url,
                                image: saved.image,
                                publishedAt: saved.publishedAt,
                                sourceName: saved.sourceName
                            }}
                            isSaved
                            onToggleSave={handleToggleSave}
                            saveDisabled={pendingUrl === saved.url}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedArticles;
