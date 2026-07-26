import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface CustomJwtPayload extends JwtPayload {
    id: string; 
}

export interface AuthRequest extends Request {
    user?: CustomJwtPayload;
}

export const verifyToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if (!token) {
        res.status(401).json({ error: "Access denied. No token provided." });
        return;
    }

    if (!process.env.JWT_SECRET) {
        res.status(500).json({ error: "JWT secret not configured." });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as CustomJwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: "Invalid or expired token." });
        return;
    }
};