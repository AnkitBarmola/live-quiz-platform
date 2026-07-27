import http from 'http';
import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = http.createServer(app as any);

server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${PORT}`);
});

export default server;
