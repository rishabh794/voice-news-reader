import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBriefingSettings, updateBriefingSettings } from '../services/api';
import type { BriefingPreferences } from '../types/news';

export const useBriefingSettings = () => {
    const queryClient = useQueryClient();

    const settingsQuery = useQuery({
        queryKey: ['briefing-settings'],
        queryFn: fetchBriefingSettings
    });

    const updateMutation = useMutation({
        mutationFn: updateBriefingSettings,
        onSuccess: (newSettings) => {
            queryClient.setQueryData(['briefing-settings'], newSettings);
        }
    });

    return {
        settings: settingsQuery.data as BriefingPreferences | undefined,
        isLoading: settingsQuery.isLoading,
        updateSettings: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending
    };
};
