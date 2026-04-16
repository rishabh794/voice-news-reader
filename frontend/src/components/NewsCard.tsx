import type { Article } from '../types/news';

interface NewsCardProps {
    article: Article;
    isSaved?: boolean;
    onToggleSave?: (article: Article) => void;
    saveDisabled?: boolean;
}

const NewsCard = ({ article, isSaved = false, onToggleSave, saveDisabled = false }: NewsCardProps) => {
    return (
        <div className="group relative flex flex-col bg-[#0d0d12]/90 backdrop-blur-md border border-gray-800/80 rounded-xl overflow-hidden hover:border-cyan-500/40 hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.15)] transition-all duration-300">
            {/* Top border glow effect on hover */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

            {onToggleSave && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggleSave(article);
                    }}
                    disabled={saveDisabled}
                    className={`absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all duration-200 ${
                        isSaved
                            ? 'text-cyan-300 border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/20'
                            : 'text-gray-300 border-gray-600/70 bg-[#0d0d12]/80 hover:border-cyan-500/40 hover:text-cyan-300'
                    } ${saveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {saveDisabled ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                </button>
            )}

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

                {article.source?.name && (
                    <p className="text-[11px] text-gray-500 font-mono mb-3 uppercase tracking-wide">
                        Source: {article.source.name}
                    </p>
                )}
                {!article.source?.name && article.sourceName && (
                    <p className="text-[11px] text-gray-500 font-mono mb-3 uppercase tracking-wide">
                        Source: {article.sourceName}
                    </p>
                )}
                
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