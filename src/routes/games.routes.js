const express = require('express');
const router = express.Router();
const mockGames = require('../mockData/games');

// Get all games
router.get('/', (req, res) => {
  res.json(mockGames);
});

// Get game by id
router.get('/:id', (req, res) => {
  const game = mockGames.find(g => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }
  res.json(game);
});

// Get active players for a game
router.get('/:id/players', (req, res) => {
  const game = mockGames.find(g => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }
  res.json({ playersOnline: game.playersOnline });
});

module.exports = router;
