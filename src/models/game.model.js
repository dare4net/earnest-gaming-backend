const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['Mobile', 'Console', 'PC']
  },
  minEntryFee: {
    type: Number,
    required: true,
    min: 0
  },
  maxEntryFee: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  rules: [{
    type: String,
    required: true
  }],
  matchFormat: {
    type: String,
    required: true,
    enum: ['1v1', '2v2', '3v3', '4v4', '5v5']
  },
  activeLeagues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  }],
  activeMatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);
