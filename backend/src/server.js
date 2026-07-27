const http = require('http');
const app = require('./app');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = server;
