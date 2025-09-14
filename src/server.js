const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Import routes
const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/games.routes');
const leagueRoutes = require('./routes/leagues.routes');
const matchRoutes = require('./routes/matches.routes');
const userRoutes = require('./routes/users.routes');
const walletRoutes = require('./routes/wallet.routes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});
app.locals.io = io;

const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

// In-memory online users tracking keyed by public userId
// Value is number of active sockets for that user
const onlineUsers = new Map();
app.locals.onlineUsers = onlineUsers;
io.onlineUsers = onlineUsers;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.replace('Bearer ', '');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    return next();
  } catch (err) {
    return next();
  }
});

io.on('connection', async (socket) => {
  try {
    if (socket.userId) {
      const user = await User.findById(socket.userId);
      if (user?.userId) {
        socket.userPublicId = user.userId;
        socket.join(`user:${user.userId}`);
        console.log(`🔌 Socket connected and joined room user:${user.userId}`);

        // Increment connection count and set DB isOnline if this is first connection
        const prevCount = onlineUsers.get(user.userId) || 0;
        onlineUsers.set(user.userId, prevCount + 1);
        if (prevCount === 0) {
          await User.findByIdAndUpdate(socket.userId, { isOnline: true, lastActive: new Date() });
        }
      }
    }
  } catch (e) {
    console.error('Socket connection error:', e);
  }

  socket.on('join-room', (room) => {
    console.log(`[socket] User ${socket.userPublicId} joining room: ${room}`);
    socket.join(room);
  });

  socket.on('disconnect', async () => {
    try {
      if (socket.userId && socket.userPublicId) {
        const prevCount = onlineUsers.get(socket.userPublicId) || 1;
        const nextCount = prevCount - 1;
        if (nextCount > 0) {
          onlineUsers.set(socket.userPublicId, nextCount);
        } else {
          onlineUsers.delete(socket.userPublicId);
          await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastActive: new Date() });
        }
      }
    } catch (e) {
      console.error('Socket disconnect error:', e);
    }
  });
});

// 🔓 Enable CORS for all origins
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI setup
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');

// Load OpenAPI spec
const openapiPath = path.join(__dirname, '..', 'openapi.json');
if (fs.existsSync(openapiPath)) {
  const openapi = require(openapiPath);
  
  // Serve OpenAPI spec as JSON
  app.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(openapi);
  });
  
  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(openapi, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Earnest Gaming API'
  }));
  
  console.log('📄 Swagger UI available at /api/docs');
  console.log('📄 OpenAPI spec available at /api/openapi.json');
} else {
  console.warn('⚠️  openapi.json not found, Swagger UI disabled');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Earnest Gaming API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
