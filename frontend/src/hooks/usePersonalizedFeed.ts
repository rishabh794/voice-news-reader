import { useQuery } from '@tanstack/react-query';
import { fetchPersonalizedFeed } from '../services/api';
import type { PersonalizedFeed } from '../types/news';

export const usePersonalizedFeed = (enabled: boolean) => {
    const feedQuery = useQuery<PersonalizedFeed>({
        queryKey: ['personalized-feed'],
        queryFn: fetchPersonalizedFeed,
        enabled,
        staleTime: 15 * 60 * 1000,
        refetchInterval: 15 * 60 * 1000
    });

    return {
        feedArticles: feedQuery.data?.articles ?? [],
        hasTopics: feedQuery.data?.hasTopics ?? false,
        topics: feedQuery.data?.topics ?? [],
        isLoading: feedQuery.isLoading,
        refetch: feedQuery.refetch
    };
};
