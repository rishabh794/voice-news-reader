import { z } from 'zod';
import { objectIdSchema } from './commonSchemas.ts';

const toOptionalTrimmedString = (value: unknown): unknown => {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
};

const optionalTrimmedStringSchema = z.preprocess(toOptionalTrimmedString, z.string().optional());

const optionalDateStringSchema = z.preprocess(
    toOptionalTrimmedString,
    z
        .string()
        .refine((value) => !Number.isNaN(new Date(value).getTime()), {
            message: 'Invalid publishedAt date'
        })
        .optional()
);

export const addSavedArticleBodySchema = z.object({
    title: z.string().trim().min(1, 'Article title is required'),
    description: optionalTrimmedStringSchema,
    url: z.string().trim().min(1, 'Article url is required'),
    image: optionalTrimmedStringSchema,
    publishedAt: optionalDateStringSchema,
    sourceName: optionalTrimmedStringSchema
});

export const deleteSavedArticleParamsSchema = z.object({
    id: objectIdSchema
});
