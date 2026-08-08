import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import mainRouter from './routes/api.js';
import morgan from 'morgan';
import { csrfProtection } from './middleware/csrfMiddleware.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

app.use(cors({
    origin: ['http://localhost:5173', 'https://voxnews.site', 'https://api.voxnews.site', 'https://voice-news-reader.vercel.app'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());
app.use(express.json({
    limit: '1mb',
    verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

app.use('/api', csrfProtection(), mainRouter);

if (process.env.NODE_ENV !== 'test') {
    connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;