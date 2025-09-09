const express = require('express');
const router = express.Router();
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const auth = require('../middleware/auth');

// Ensure wallet exists for user
async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }
  return wallet;
}

// Get user wallet
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.params.userId);
    if (String(req.user._id) !== String(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: cannot view other user\'s wallet' });
    }
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
});

// Get user transactions
router.get('/user/:userId/transactions', auth, async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: cannot view other user\'s transactions' });
    }
    const transactions = await Transaction.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Create a transaction (deposit/withdrawal and system events)
router.post('/transaction', auth, async (req, res) => {
  try {
    const { userId, type, amount, currency = 'NGN', paymentMethod = 'system', description = '' } = req.body;
    if (!userId || !type || typeof amount !== 'number') {
      return res.status(400).json({ message: 'userId, type and numeric amount are required' });
    }
    if (String(req.user._id) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: cannot create transactions for other users' });
    }
    const wallet = await getOrCreateWallet(userId);

    const balanceBefore = wallet.balance;

    // Update balances based on type
    if (type === 'deposit') {
      wallet.balance += amount;
      wallet.totalDeposited += amount;
      wallet.lastDeposit = new Date();
    } else if (type === 'withdrawal') {
      if (wallet.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      wallet.balance -= amount;
      wallet.totalWithdrawn += amount;
      wallet.lastWithdrawal = new Date();
    } else {
      // Other types like matchEntry/matchWin/leagueEntry/leaguePrize/refund
      wallet.balance += amount; // positive or negative amounts supported
    }

    await wallet.save();

    const reference = `TX-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const tx = await Transaction.create({
      user: userId,
      type,
      amount,
      currency,
      status: 'completed',
      reference,
      description,
      paymentMethod,
      balanceBefore,
      balanceAfter: wallet.balance
    });

    res.status(201).json(tx);
  } catch (error) {
    res.status(400).json({ message: 'Error creating transaction', error: error.message });
  }
});

module.exports = router;
