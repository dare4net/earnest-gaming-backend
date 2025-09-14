const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  game: {
    type: String,
    required: true,
    enum: ['CODM', 'eFootball', 'FIFA']
  },
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  },
  matchType: {
    type: String,
    enum: ['regular', 'league'],
    default: 'regular'
  },
  matchmakingStatus: {
    type: String,
    enum: ['searching', 'matched', 'ready'],
    default: 'searching'
  },
  // When creator invites a specific player, store their user id here until accept/decline
  pendingInviteUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    team: {
      type: String,
      enum: ['A', 'B'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'ready', 'playing', 'disconnected', 'finished'],
      default: 'pending'
    },
    score: {
      type: Number,
      default: 0
    },
    screenshot: {
      type: String
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['scheduled', 'inProgress', 'verification', 'disputed', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  entryFee: {
    type: Number,
    required: true,
    min: 0
  },
  prizePool: {
    type: Number,
    required: true,
    min: 0
  },
  format: {
    type: String,
    required: true,
    enum: ['1v1', '2v2', '3v3', '4v4', '5v5']
  },
  rules: [{
    type: String,
    required: true
  }],
  chat: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  dispute: {
    status: {
      type: String,
      enum: ['none', 'raised', 'reviewing', 'resolved'],
      default: 'none'
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    evidence: [String],
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'disputed'],
      default: 'pending'
    },
    startedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String
  },
  escrow: {
    totalAmount: {
      type: Number,
      required: true
    },
    platformFee: {
      type: Number,
      default: 0
    },
    winnerPayout: {
      type: Number,
      default: 0
    },
    refunded: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);
