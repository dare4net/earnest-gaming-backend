const express = require('express');
const router = express.Router();
const { mockLeagues } = require('../data/mockData');

// Get all leagues
router.get('/', (req, res) => {
  res.json(mockLeagues);
});

// Get league by ID
router.get('/:id', (req, res) => {
  const league = mockLeagues.find(l => l.id === req.params.id);
  if (!league) {
    return res.status(404).json({ message: 'League not found' });
  }
  res.json(league);
});

// Create new league
router.post('/', (req, res) => {
  const newLeague = {
    id: (mockLeagues.length + 1).toString(),
    ...req.body,
    participants: 0,
    status: 'registration_open'
  };
  mockLeagues.push(newLeague);
  res.status(201).json(newLeague);
});

// Update league
router.put('/:id', (req, res) => {
  const index = mockLeagues.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'League not found' });
  }
  mockLeagues[index] = { ...mockLeagues[index], ...req.body };
  res.json(mockLeagues[index]);
});

// Delete league
router.delete('/:id', (req, res) => {
  const index = mockLeagues.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'League not found' });
  }
  mockLeagues.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
