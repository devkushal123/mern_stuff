import http from 'http';
import { buildApp } from './app.js';
import { connectDB } from './db/mongoose.js';
import { env } from './config/env.js';
import { setupSocket } from './socket.js';

(async () => {
  await connectDB();
  const app = buildApp();
  const server = http.createServer(app);
  setupSocket(server, env.corsOrigin);
  server.listen(env.port, () => console.log(`🚀 API + Socket at http://localhost:${env.port}`));
})();
