const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: "*" }
  });

  // Track connected users per event room
  const eventUsers = {}; // { eventId: { userId: { lat, lng, socketId } } }

  io.on('connection', (socket) => {
    console.log(`[+] Client connected: ${socket.id}`);

    // Join a specific event room
    socket.on('join-event', (eventId) => {
      socket.join(eventId);
      socket.eventId = eventId;
      console.log(`[Room] ${socket.id} joined event ${eventId}`);
    });

    // Handle real-time location updates
    socket.on('update-location', (data) => {
      // data: { eventId, userId, lat, lng, name?, seat? }
      if (data && data.eventId) {
        // Track the user
        if (!eventUsers[data.eventId]) eventUsers[data.eventId] = {};
        eventUsers[data.eventId][data.userId] = {
          lat: data.lat,
          lng: data.lng,
          socketId: socket.id,
          name: data.name,
          seat: data.seat,
        };

        // Broadcast to everyone else in the room (admin dashboard)
        socket.to(data.eventId).emit('location-updated', data);
      }
    });

    // Handle SOS alerts
    socket.on('sos-alert', (data) => {
      // data: { eventId, userId, lat, lng }
      if (data && data.eventId) {
        console.log(`[!!! SOS !!!] User ${data.userId} at (${data.lat}, ${data.lng})`);
        // Broadcast SOS to everyone in the room (security dashboard)
        io.to(data.eventId).emit('sos-alert', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[-] Client disconnected: ${socket.id}`);
      // Clean up user from event tracking
      if (socket.eventId && eventUsers[socket.eventId]) {
        const users = eventUsers[socket.eventId];
        for (const userId of Object.keys(users)) {
          if (users[userId].socketId === socket.id) {
            delete users[userId];
            // Notify admin dashboard
            io.to(socket.eventId).emit('user-disconnected', { userId });
            break;
          }
        }
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`
╔══════════════════════════════════════════╗
║      VeNeck Server is LIVE            ║
║      http://localhost:${PORT}              ║
║      Socket.io: Ready                    ║
╚══════════════════════════════════════════╝
    `);
  });
});
