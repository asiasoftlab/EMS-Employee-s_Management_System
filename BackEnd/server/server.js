import './src/config/environment.js';
import app from './app.js';
import http from 'http';
import { initializeSocket } from './socket.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initializeSocket(server);
server.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
});