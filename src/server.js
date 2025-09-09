const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

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

// 🔓 Enable CORS for all origins
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI (served if openapi.json is present)
try {
  const path = require('path');
  const fs = require('fs');
  const swaggerUi = require('swagger-ui-express');
  const openapiPath = path.join(__dirname, '..', 'openapi.json');
  if (fs.existsSync(openapiPath)) {
    const openapi = require(openapiPath);
    app.get('/api/openapi.json', (req, res) => res.json(openapi));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
    console.log('📄 Swagger UI available at /api/docs');
  }
} catch (e) {
  console.warn('Swagger UI not configured:', e?.message);
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
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
