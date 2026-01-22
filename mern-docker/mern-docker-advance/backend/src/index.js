
import { createApp } from './server.js';
import { connectDB } from './utils/db.js';

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const app = createApp();

let server;
(async () => {
  await connectDB(MONGO_URI);
  server = app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
})();

// Graceful shutdown
const shutdown = (signal) => async () => {
  console.log(`${signal} received. Shutting down...`);
  try {
    server?.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000);
  } catch {
    process.exit(1);
  }
};
['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, shutdown(sig)));
