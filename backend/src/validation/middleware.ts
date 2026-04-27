import type { NextFunction, Request, Response } from 'express';
import { type ZodTypeAny } from 'zod';

interface ValidationSchemas {
    body?: ZodTypeAny;
    params?: ZodTypeAny;
    query?: ZodTypeAny;
}

const toFieldPath = (segment: 'body' | 'params' | 'query', path: PropertyKey[]): string => {
    if (path.length === 0) return segment;
    return `${segment}.${path.map((part) => String(part)).join('.')}`;
};

export const validateRequest = ({ body, params, query }: ValidationSchemas) => (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const issues: Array<{ field: string; message: string }> = [];

    if (body) {
        const parsedBody = body.safeParse(req.body);
        if (!parsedBody.success) {
            issues.push(
                ...parsedBody.error.issues.map((issue) => ({
                    field: toFieldPath('body', issue.path),
                    message: issue.message
                }))
            );
        } else {
            req.body = parsedBody.data; //automatically strips out any fields that was not explicitly define in the schema
        }
    }

    if (params) {
        const parsedParams = params.safeParse(req.params);
        if (!parsedParams.success) {
            issues.push(
                ...parsedParams.error.issues.map((issue) => ({
                    field: toFieldPath('params', issue.path),
                    message: issue.message
                }))
            );
        } else {
            req.params = parsedParams.data as Request['params'];
        }
    }

    if (query) {
        const parsedQuery = query.safeParse(req.query);
        if (!parsedQuery.success) {
            issues.push(
                ...parsedQuery.error.issues.map((issue) => ({
                    field: toFieldPath('query', issue.path),
                    message: issue.message
                }))
            );
        } else {
            req.query = parsedQuery.data as Request['query'];
        }
    }

    if (issues.length > 0) {
        res.status(400).json({
            error: 'Validation failed',
            details: issues
        });
        return;
    }

    next();
};
