import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * CSRF Protection Middleware
 * 
 * Enforces that all state-changing API requests (POST, PUT, PATCH, DELETE)
 * must include a custom header (e.g. X-Requested-With).
 * 
 * This protects the application from Cross-Site Request Forgery (CSRF) 
 * by forcing the browser to issue a CORS preflight request for cross-origin requests,
 * preventing malicious sites from submitting hidden forms.
 */
export const csrfProtection = (): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Skip for non-state-changing requests
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            next();
            return;
        }

        // Require custom header for state-changing requests
        const requestedWith = req.get('X-Requested-With');
        if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
            res.status(403).json({ 
                error: 'CSRF Protection: Missing or invalid X-Requested-With header.' 
            });
            return;
        }

        next();
    };
};
