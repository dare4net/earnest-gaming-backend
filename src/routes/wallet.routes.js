const express = require('express');
const router = express.Router();
const mockWallets = require('../mockData/wallets');

// Get user wallet
router.get('/user/:userId', (req, res) => {
  const wallet = mockWallets.find(w => w.userId === req.params.userId);
  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found' });
  }
  res.json(wallet);
});

// Get user transactions
router.get('/user/:userId/transactions', (req, res) => {
  const wallet = mockWallets.find(w => w.userId === req.params.userId);
  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found' });
  }
  res.json(wallet.transactions);
});

// Create a transaction (mock)
router.post('/transaction', (req, res) => {
  const { userId, type, amount } = req.body;
  const wallet = mockWallets.find(w => w.userId === userId);
  
  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found' });
  }

  const transaction = {
    id: String(wallet.transactions.length + 1),
    type,
    amount,
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  wallet.transactions.push(transaction);
  res.status(201).json(transaction);
});

module.exports = router;
