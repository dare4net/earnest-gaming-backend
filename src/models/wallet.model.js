const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'NGN'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'frozen', 'suspended'],
    default: 'active'
  },
  totalDeposited: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWinnings: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethods: [{
    type: {
      type: String,
      required: true,
      enum: ['bank', 'card']
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    bank: String,
    accountNumber: String,
    accountName: String,
    lastFour: String,
    expiryDate: String,
    brand: String
  }],
  withdrawalLimit: {
    daily: {
      type: Number,
      default: 100000,
      min: 0
    },
    weekly: {
      type: Number,
      default: 500000,
      min: 0
    },
    monthly: {
      type: Number,
      default: 2000000,
      min: 0
    }
  },
  lastWithdrawal: {
    type: Date
  },
  lastDeposit: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for quick lookup
walletSchema.index({ user: 1 }, { unique: true });
walletSchema.index({ status: 1 });

// Middleware to ensure withdrawal limits are respected
walletSchema.pre('save', async function(next) {
  if (this.isModified('balance') && this.balance < 0) {
    throw new Error('Wallet balance cannot be negative');
  }
  next();
});

// Virtual for calculating available withdrawal amount
walletSchema.virtual('availableWithdrawal').get(function() {
  return Math.min(
    this.balance,
    this.withdrawalLimit.daily,
    this.withdrawalLimit.weekly,
    this.withdrawalLimit.monthly
  );
});

module.exports = mongoose.model('Wallet', walletSchema);
