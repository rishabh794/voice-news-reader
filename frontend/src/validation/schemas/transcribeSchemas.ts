import { z } from 'zod';

export const transcribeResponseSchema = z.object({
    text: z.string()
});
