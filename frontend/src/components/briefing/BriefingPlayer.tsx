import { Play, Pause, Square, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

interface BriefingPlayerProps {
    script: string;
    isPlaying: boolean;
    isPaused: boolean;
    isLoading: boolean;
    isError: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
}

const BriefingPlayer = ({
    isPlaying,
    isPaused,
    isLoading,
    isError,
    onPlay,
    onPause,
    onStop
}: BriefingPlayerProps) => {
    return (
        <div className="flex items-center gap-3 p-4 bg-card border border-border/70 rounded-xl">
            {isError ? (
                <div className="flex items-center gap-2 text-danger text-sm">
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to play audio. Please try again.</span>
                </div>
            ) : (
                <>
                    <Button
                        variant="primary"
                        size="md"
                        className="min-w-[140px] px-4"
                        disabled={isLoading}
                        onClick={isPlaying ? onPause : onPlay}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPlaying ? (
                            <>
                                <Pause className="w-4 h-4" />
                                Pause
                            </>
                        ) : isPaused ? (
                            <>
                                <Play className="w-4 h-4" />
                                Resume
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Play Briefing
                            </>
                        )}
                    </Button>
                    
                    {(isPlaying || isPaused || isLoading) && (
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={onStop}
                            className="!px-3"
                            title="Stop playback"
                        >
                            <Square className="w-4 h-4" />
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default BriefingPlayer;
