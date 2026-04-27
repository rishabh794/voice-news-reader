import axios from 'axios';
import { z, type ZodTypeAny } from 'zod';

export const validateWithSchema = <TSchema extends ZodTypeAny>(
    schema: TSchema,
    payload: unknown,
    fallbackMessage: string
): z.infer<TSchema> => {
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || fallbackMessage);
    }

    return parsed.data;
};

export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: unknown } | undefined;
        if (typeof data?.error === 'string' && data.error.trim()) {
            return data.error;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
};
