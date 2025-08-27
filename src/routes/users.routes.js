const express = require('express');
const router = express.Router();
const mockUsers = require('../mockData/users');

// Get all users
router.get('/', (req, res) => {
  // Remove sensitive information
  const sanitizedUsers = mockUsers.map(({ email, ...user }) => user);
  res.json(sanitizedUsers);
});

// Get user by id
router.get('/:id', (req, res) => {
  const user = mockUsers.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Remove sensitive information
  const { email, ...sanitizedUser } = user;
  res.json(sanitizedUser);
});

// Get user stats
router.get('/:id/stats', (req, res) => {
  const user = mockUsers.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const stats = {
    matchesPlayed: user.matchesPlayed,
    winRate: user.winRate,
    achievements: user.achievements
  };
  res.json(stats);
});

module.exports = router;
