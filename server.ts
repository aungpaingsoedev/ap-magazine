import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { Server } from 'socket.io';
import { setIO } from './src/lib/realtime/io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || true,
      methods: ['GET', 'POST'],
    },
  });

  setIO(io);

  io.on('connection', (socket) => {
    socket.join('magazine');
  });

  httpServer.listen(port, () => {
    console.log(`> Atlas ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO path /api/socketio`);
  });
});
