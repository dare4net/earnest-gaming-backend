const express = require('express');
const router = express.Router();
const mockMatches = require('../mockData/matches');

// Get all matches
router.get('/', (req, res) => {
  res.json(mockMatches);
});

// Get match by id
router.get('/:id', (req, res) => {
  const match = mockMatches.find(m => m.id === req.params.id);
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }
  res.json(match);
});

// Get user's matches
router.get('/user/:userId', (req, res) => {
  const userMatches = mockMatches.filter(m => 
    m.player1.id === req.params.userId || 
    m.player2.id === req.params.userId
  );
  res.json(userMatches);
});

// Create a new match (mock)
router.post('/', (req, res) => {
  const newMatch = {
    id: String(mockMatches.length + 1),
    status: 'waiting',
    startTime: new Date().toISOString(),
    ...req.body
  };
  mockMatches.push(newMatch);
  res.status(201).json(newMatch);
});

module.exports = router;
