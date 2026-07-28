
export default function VoxLogo({ className = "w-8 h-8" }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* Abstract representation: Audio waves + fluid lines of text */}
            <path 
                d="M4 10 Q 10 2 16 10 T 28 10" 
                stroke="currentColor" 
                strokeOpacity="0.2" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
            />
            <path 
                d="M4 17 Q 10 9 16 17 T 28 17" 
                stroke="var(--color-primary, #3b82f6)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
            />
            <path 
                d="M4 24 Q 10 16 16 24 T 28 24" 
                stroke="currentColor" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
            />
        </svg>
    );
}
