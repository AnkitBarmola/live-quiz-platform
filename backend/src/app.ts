import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
	res.json({ status: 'ok', message: 'Live Quiz Platform backend' });
});

export default app;
