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
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
