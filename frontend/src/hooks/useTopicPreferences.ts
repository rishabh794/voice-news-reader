import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTopicPreferences, updateTopicPreferences } from '../services/api';
import type { TopicCategory } from '../types/news';

export const useTopicPreferences = () => {
    const queryClient = useQueryClient();

    const topicsQuery = useQuery({
        queryKey: ['topic-preferences'],
        queryFn: fetchTopicPreferences
    });

    const updateTopicsMutation = useMutation({
        mutationFn: updateTopicPreferences,
        onSuccess: (newTopics) => {
            queryClient.setQueryData(['topic-preferences'], newTopics);
            queryClient.invalidateQueries({ queryKey: ['personalized-feed'] });
        }
    });

    return {
        topics: (topicsQuery.data ?? []) as TopicCategory[],
        isLoading: topicsQuery.isLoading,
        hasTopics: (topicsQuery.data?.length ?? 0) > 0,
        updateTopics: updateTopicsMutation.mutateAsync,
        isUpdating: updateTopicsMutation.isPending
    };
};
