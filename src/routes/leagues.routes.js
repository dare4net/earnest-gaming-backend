const express = require('express');
const router = express.Router();
const League = require('../models/league.model');
const Game = require('../models/game.model');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// Get all leagues
router.get('/', async (req, res) => {
  try {
    const leagues = await League.find()
      .populate('game', 'title slug')
      .populate('matches')
      .lean();
    res.json(leagues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leagues', error: error.message });
  }
});

// Get league by ID
router.get('/:id', async (req, res) => {
  try {
    const league = await League.findById(req.params.id)
      .populate('game', 'title slug')
      .populate({ path: 'participants.user', select: 'username avatar rank' })
      .populate('matches')
      .lean();
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    res.json(league);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching league', error: error.message });
  }
});

// Create new league
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { game, ...payload } = req.body;
    const gameDoc = await Game.findById(game);
    if (!gameDoc) {
      return res.status(400).json({ message: 'Invalid game id' });
    }
    const league = await League.create({ game, ...payload });
    res.status(201).json(league);
  } catch (error) {
    res.status(400).json({ message: 'Error creating league', error: error.message });
  }
});

// Update league
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const league = await League.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('game', 'title slug');
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    res.json(league);
  } catch (error) {
    res.status(400).json({ message: 'Error updating league', error: error.message });
  }
});

// Delete league
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const league = await League.findByIdAndDelete(req.params.id);
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting league', error: error.message });
  }
});

module.exports = router;
