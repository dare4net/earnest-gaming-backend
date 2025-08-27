const express = require('express');
const router = express.Router();
const { users } = require('../data/mockData');

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  next();
};

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Mock token
  const token = 'mock_jwt_token';
  res.json({ token, user });
});

// Register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  const newUser = {
    id: String(users.length + 1),
    username,
    email,
    balance: 0,
    games: [],
    matches: [],
    leagues: []
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

module.exports = router;
