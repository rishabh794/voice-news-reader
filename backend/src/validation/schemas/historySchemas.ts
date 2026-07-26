import { z } from 'zod';
import { objectIdSchema } from './commonSchemas.js';

export const deleteHistoryParamsSchema = z.object({
    historyId: objectIdSchema
});
