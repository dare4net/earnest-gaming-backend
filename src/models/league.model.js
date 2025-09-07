const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
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
  maxParticipants: {
    type: Number,
    required: true,
    min: 2
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['registered', 'verified', 'disqualified'],
      default: 'registered'
    },
    points: {
      type: Number,
      default: 0
    },
    position: {
      type: Number
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  format: {
    type: String,
    required: true,
    enum: ['knockout', 'roundRobin', 'groupStage']
  },
  status: {
    type: String,
    required: true,
    enum: ['upcoming', 'registration', 'inProgress', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  rules: [{
    type: String,
    required: true
  }],
  schedule: [{
    round: Number,
    startTime: Date,
    matches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    }]
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  runners: [{
    position: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    prize: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('League', leagueSchema);
