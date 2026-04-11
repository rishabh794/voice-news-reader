import React from 'react';

interface Article {
    title: string;
    description: string;
    url: string;
    image?: string;
}

interface NewsCardProps {
    article: Article;
}

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
    return (
        <div className="border border-gray-300 p-4 flex flex-col bg-white hover:shadow-lg transition-shadow">
            {article.image && (
                <img 
                    src={article.image} 
                    alt="News thumbnail" 
                    className="w-full h-[150px] object-cover mb-2.5 rounded" 
                />
            )}
            <h3 className="text-lg m-0 mb-2.5 font-semibold leading-tight">{article.title}</h3>
            <p className="text-sm text-gray-600 grow mb-4 line-clamp-3">{article.description}</p>
            <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-auto text-blue-600 hover:text-blue-800 hover:underline font-semibold"
            >
                Read Full Article
            </a>
        </div>
    );
};

export default NewsCard;