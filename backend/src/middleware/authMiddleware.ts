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
): any => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "JWT secret not configured." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as CustomJwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};