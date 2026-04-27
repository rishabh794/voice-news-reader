import { z } from 'zod';
import { objectIdSchema } from './commonSchemas.ts';

export const deleteHistoryParamsSchema = z.object({
    historyId: objectIdSchema
});
