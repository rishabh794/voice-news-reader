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
        <div className="group relative flex flex-col bg-[#0d0d12]/90 backdrop-blur-md border border-gray-800/80 rounded-xl overflow-hidden hover:border-cyan-500/40 hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)] transition-all duration-300">
            {/* Top border glow effect on hover */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

            {article.image && (
                <div className="relative">
                    <img 
                        src={article.image} 
                        alt="News thumbnail" 
                        className="w-full h-[160px] object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" 
                    />
                    {/* Gradient overlay to smoothly blend the image into the dark card background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12]/90 via-transparent to-transparent"></div>
                </div>
            )}
            
            <div className="flex flex-col flex-grow p-5 z-10">
                <h3 className="text-lg font-medium text-gray-100 leading-snug mb-3 group-hover:text-white transition-colors duration-300">
                    {article.title}
                </h3>
                
                <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed font-sans opacity-80">
                    {article.description}
                </p>
                
                <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-auto inline-flex items-center w-fit text-cyan-500 font-mono text-xs uppercase tracking-widest hover:text-cyan-300 transition-colors duration-200"
                >
                    <span className="mr-2 text-indigo-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        &gt;
                    </span>
                    Read_Article
                </a>
            </div>
        </div>
    );
};

export default NewsCard;