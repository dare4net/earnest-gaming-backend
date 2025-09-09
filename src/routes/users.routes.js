const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Match = require('../models/match.model');

// Get all users (sanitized)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Leaderboard (top by wins, then winRate)
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .select('username avatar wins winRate earnings rank previousRank')
      .sort({ wins: -1, winRate: -1 })
      .limit(50)
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
});

// Get user by id (sanitized)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Get user stats (derived)
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('wins winRate earnings').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const matchesPlayed = await Match.countDocuments({ 'players.user': req.params.id });
    res.json({
      matchesPlayed,
      winRate: user.winRate,
      earnings: user.earnings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user stats', error: error.message });
  }
});

module.exports = router;
