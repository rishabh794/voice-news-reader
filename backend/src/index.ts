import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.ts';
import mainRouter from './routes/api.ts';

dotenv.config();

const app = express();

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

app.use(cors());
app.use(express.json({ 
    limit: '1mb',
    verify: (req: express.Request, _res: express.Response, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

connectDB();

app.use('/api', mainRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});