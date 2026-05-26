import app from './app.js';
import dotenv from 'dotenv';
import http from 'http';
import { initializeSocket } from './socket.js';

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initializeSocket(server);
server.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
});