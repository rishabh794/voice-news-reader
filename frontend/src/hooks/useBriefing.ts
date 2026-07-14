import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLatestBriefing, generateBriefing, fetchBriefingHistory, fetchBriefingById } from '../services/api';
import useAudioPlayer from './useAudioPlayer';


export const useBriefing = () => {
    const queryClient = useQueryClient();
    const audioPlayer = useAudioPlayer();

    const latestBriefingQuery = useQuery({
        queryKey: ['briefing', 'latest'],
        queryFn: fetchLatestBriefing
    });

    const generateMutation = useMutation({
        mutationFn: generateBriefing,
        onSuccess: (newBriefing) => {
            queryClient.setQueryData(['briefing', 'latest'], newBriefing);
            queryClient.invalidateQueries({ queryKey: ['briefing', 'history'] });
        }
    });

    return {
        briefing: latestBriefingQuery.data,
        isLoading: latestBriefingQuery.isLoading,
        isGenerating: generateMutation.isPending,
        generateBriefing: generateMutation.mutateAsync,
        audioPlayer,
        refetch: latestBriefingQuery.refetch
    };
};

export const useBriefingHistory = (page: number, limit: number) => {
    return useQuery({
        queryKey: ['briefing', 'history', page, limit],
        queryFn: () => fetchBriefingHistory(page, limit)
    });
};

export const useBriefingDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['briefing', 'detail', id],
        queryFn: () => fetchBriefingById(id!),
        enabled: !!id
    });
};
