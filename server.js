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

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a specific event room
    socket.on('join-event', (eventId) => {
      socket.join(eventId);
      console.log(`Socket ${socket.id} joined event ${eventId}`);
    });

    // Handle real-time location updates
    socket.on('update-location', (data) => {
      // Broadcast to everyone in the room (admin dashboard listens to this)
      // data: { eventId, userId, lat, lng }
      if (data && data.eventId) {
        // Broadcasts to all clients in the room INCLUDING the sender (if we wanted to omit sender, we'd use .to() or .broadcast.to())
        // For admin dashboard, we broadcast to the room.
        socket.to(data.eventId).emit('location-updated', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
