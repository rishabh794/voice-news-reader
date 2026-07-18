import { z } from 'zod';

export const updateBriefingSettingsBodySchema = z.object({
    enabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional()
});

export const briefingHistoryQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(30).default(10)
});
