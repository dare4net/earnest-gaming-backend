const express = require('express');
const router = express.Router();
const Game = require('../models/game.model');

// Get all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.find().lean();
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching games', error: error.message });
  }
});

// Get game by id
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).lean();
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching game', error: error.message });
  }
});

// Placeholder: active players for a game (requires realtime infra)
router.get('/:id/players', async (req, res) => {
  try {
    const exists = await Game.exists({ _id: req.params.id });
    if (!exists) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json({ playersOnline: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching players', error: error.message });
  }
});

module.exports = router;
