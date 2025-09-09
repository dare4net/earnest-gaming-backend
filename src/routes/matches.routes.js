const express = require('express');
const router = express.Router();
const Match = require('../models/match.model');
const Game = require('../models/game.model');
const League = require('../models/league.model');
const auth = require('../middleware/auth');

// Get all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find()
      .populate('game', 'title slug')
      .populate('league', 'name')
      .populate('players.user', 'username avatar')
      .lean();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
});

// Get match by id
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('game', 'title slug')
      .populate('league', 'name')
      .populate('players.user', 'username avatar')
      .lean();
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching match', error: error.message });
  }
});

// Get user's matches
router.get('/user/:userId', async (req, res) => {
  try {
    const matches = await Match.find({ 'players.user': req.params.userId })
      .populate('game', 'title slug')
      .populate('league', 'name')
      .populate('players.user', 'username avatar')
      .lean();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user matches', error: error.message });
  }
});

// Create a new match
router.post('/', auth, async (req, res) => {
  try {
    const { game, league, ...payload } = req.body;
    const gameDoc = await Game.findById(game);
    if (!gameDoc) {
      return res.status(400).json({ message: 'Invalid game id' });
    }
    if (league) {
      const leagueDoc = await League.findById(league);
      if (!leagueDoc) {
        return res.status(400).json({ message: 'Invalid league id' });
      }
    }
    const match = await Match.create({ game, league, ...payload });
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ message: 'Error creating match', error: error.message });
  }
});

module.exports = router;
