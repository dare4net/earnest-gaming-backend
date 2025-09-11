const express = require('express');
const router = express.Router();
const Match = require('../models/match.model');
const Game = require('../models/game.model');
const League = require('../models/league.model');
const User = require('../models/user.model');
const auth = require('../middleware/auth');

// Helper to compute a simple lifecycle status for frontend
function computeMatchStatus(match) {
  if (!match) return 'matching';
  if (match.status === 'inProgress') return 'playing';
  if (match.status === 'verification') return 'verification';
  if (match.status === 'completed') return 'finished';
  if (match.matchmakingStatus === 'matched') return 'matched';
  return 'matching';
}

// Get all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find()
      .populate('league', 'name')
      .populate('players.user', 'username avatar')
      .lean();
    const withStatus = matches.map(m => ({ ...m, matchStatus: computeMatchStatus(m) }));
    res.json(withStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching matches', error: error.message });
  }
});

// Get match by id
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('league', 'name')
      .populate('players.user', 'username avatar')
      .lean();
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }
  res.json({ ...match, matchStatus: computeMatchStatus(match) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching match', error: error.message });
  }
});

// Get user's matches
router.get('/user/:userId', async (req, res) => {
  try {
    const matches = await Match.find({ 'players.user': req.params.userId })
      .populate('league', 'name')
      .populate('players.user', 'username avatar')
      .lean();
    const withStatus = matches.map(m => ({ ...m, matchStatus: computeMatchStatus(m) }));
    res.json(withStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user matches', error: error.message });
  }
});

// Get user's active matches (for returning to platform)
router.get('/user/:userId/active', async (req, res) => {
  try {
    const matches = await Match.find({ 
      'players.user': req.params.userId,
      status: { $in: ['scheduled', 'inProgress', 'verification'] }
    })
    .populate('players.user', 'username avatar')
    .sort({ createdAt: -1 })
    .lean();
    const withStatus = matches.map(m => ({ ...m, matchStatus: computeMatchStatus(m) }));
    res.json(withStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active matches', error: error.message });
  }
});

// Create a new match (regular 1v1 or league)
/*router.post('/', auth, async (req, res) => {
  try {
    const { game, league, entryFee, ...payload } = req.body;
    const gameDoc = await Game.findById(game);
    if (!gameDoc) {
      return res.status(400).json({ message: 'Invalid game id' });
    }
    
    let matchType = 'regular';
    if (league) {
      const leagueDoc = await League.findById(league);
      if (!leagueDoc) {
        return res.status(400).json({ message: 'Invalid league id' });
      }
      matchType = 'league';
    }
    
    // Calculate escrow amounts
    const platformFee = Math.round(entryFee * 0.05); // 5% platform fee
    const winnerPayout = (entryFee * 2) - platformFee;
    
    const match = await Match.create({ 
      game, 
      league, 
      matchType,
      entryFee,
      prizePool: entryFee * 2,
      escrow: {
        totalAmount: entryFee * 2,
        platformFee,
        winnerPayout
      },
      ...payload 
    });
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ message: 'Error creating match', error: error.message });
  }
});*/

// Search for opponents for a specific match
router.post('/:id/searchOpponent', auth, async (req, res) => {
  try {
    console.log('[searchOpponent] user=%s matchId=%s', req.user?._id, req.params.id);
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if user owns this match
    if (String(match.players[0].user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to search opponents for this match' });
    }
    
    // Check if match is still available for searching
    if (match.matchmakingStatus !== 'searching' || match.players.length > 1) {
      return res.status(400).json({ message: 'Match is no longer available for opponent search' });
    }
    
    // Get random online users as potential opponents
    const potentialOpponents = await User.find({
      _id: { $ne: req.user._id }, // Exclude current user
      isOnline: true
    })
    .select('username avatar rank winRate earnings')
    .limit(10) // Limit to 10 random online users
    .lean();
    console.log('[searchOpponent] found %d online users', potentialOpponents.length);
    res.json({
      matchId: match._id,
      potentialOpponents: potentialOpponents,
      searchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('[searchOpponent][error]', error);
    res.status(500).json({ message: 'Error searching for opponents', error: error.message });
  }
});

// Match with a specific player ID
router.post('/:id/matchWithPlayer', auth, async (req, res) => {
  try {
    const { playerId } = req.body;
    console.log('[matchWithPlayer] user=%s matchId=%s targetPlayer=%s', req.user?._id, req.params.id, playerId);
    
    if (!playerId) {
      return res.status(400).json({ message: 'playerId is required' });
    }
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if user owns this match
    if (String(match.players[0].user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to match players for this match' });
    }
    
    // Check if match is still available for matching
    if (match.matchmakingStatus !== 'searching' || match.players.length > 1) {
      return res.status(400).json({ message: 'Match is no longer available for matching' });
    }
    
    // Instead of finding/joining target's match, attach target player to THIS match
    // Ensure match is still available
    if (match.players.length >= 2) {
      return res.status(400).json({ message: 'Match is full' });
    }
    if (match.matchmakingStatus !== 'searching') {
      return res.status(400).json({ message: 'Match is not available for matching' });
    }
    // Prevent matching with yourself
    if (String(playerId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot match with yourself' });
    }
    // Prevent duplicate
    if (match.players.some(p => String(p.user) === String(playerId))) {
      return res.status(400).json({ message: 'Player already in match' });
    }

    match.players.push({
      user: playerId,
      team: 'B',
      status: 'pending'
    });
    match.matchmakingStatus = 'matched';
    match.status = 'scheduled';
    await match.save();
    console.log('[matchWithPlayer] matched. matchId=%s players=%d', match._id, match.players.length);

    const populatedMatch = await Match.findById(match._id)
      .populate('players.user', 'username avatar');

    res.json({
      action: 'matched_with_player',
      match: populatedMatch,
      targetPlayer: playerId
    });
  } catch (error) {
    console.error('[matchWithPlayer][error]', error);
    res.status(400).json({ message: 'Error matching with player', error: error.message });
  }
});

// Join a match
router.post('/:id/join', auth, async (req, res) => {
  try {
    console.log('[join] user=%s matchId=%s', req.user?._id, req.params.id);
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    if (match.players.length >= 2) {
      return res.status(400).json({ message: 'Match is full' });
    }
    
    if (match.matchmakingStatus !== 'searching') {
      return res.status(400).json({ message: 'Match is not available for joining' });
    }
    
    // Check if user is trying to join their own match
    if (String(match.players[0].user) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot join your own match' });
    }
    
    // Add player to match
    match.players.push({
      user: req.user._id,
      team: 'B',
      status: 'pending'
    });
    match.matchmakingStatus = 'matched';
    match.status = 'scheduled'; // Move to next stage
    await match.save();
    console.log('[join] joined. matchId=%s players=%d', match._id, match.players.length);
    
    const populatedMatch = await Match.findById(match._id)
      .populate('players.user', 'username avatar');
    
    res.json({
      action: 'joined',
      match: populatedMatch
    });
  } catch (error) {
    console.error('[join][error]', error);
    res.status(400).json({ message: 'Error joining match', error: error.message });
  }
});

// Create a match (always creates, even if no opponent)
router.post('/create', auth, async (req, res) => {
  try {
    const { game, matchType = 'regular', entryFee = 1000, format = '1v1', rules = ['Best of 3'] } = req.body;
    
    // Validate game name
    const validGames = ['CODM', 'eFootball', 'FIFA'];
    if (!validGames.includes(game)) {
      return res.status(400).json({ message: 'Invalid game. Must be one of: CODM, eFootball, FIFA' });
    }
    
    const platformFee = Math.round(entryFee * 0.05);
    const winnerPayout = (entryFee * 2) - platformFee;
    
    const newMatch = await Match.create({
      game,
      matchType,
      entryFee,
      prizePool: entryFee * 2,
      format,
      rules,
      startTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      escrow: {
        totalAmount: entryFee * 2,
        platformFee,
        winnerPayout
      },
      players: [{
        user: req.user._id,
        team: 'A',
        status: 'pending'
      }]
    });
    
    const populatedMatch = await Match.findById(newMatch._id)
      .populate('players.user', 'username avatar');
    
    res.json({
      action: 'created',
      match: populatedMatch
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating match', error: error.message });
  }
});


// Delete a match (only if not started)
router.delete('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if user owns this match
    if (String(match.players[0].user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this match' });
    }
    
    // Check if match can be deleted (only if still searching - not started)
    if (match.matchmakingStatus !== 'searching' || match.status !== 'scheduled') {
      return res.status(400).json({ message: 'Cannot delete match that has started' });
    }
    
    await Match.findByIdAndDelete(req.params.id);
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting match', error: error.message });
  }
});

// Submit screenshot for verification
router.post('/:id/screenshot', auth, async (req, res) => {
  try {
    const { screenshot, playerIndex } = req.body;
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    const player = match.players[playerIndex];
    if (!player || String(player.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to submit screenshot for this player' });
    }
    
    player.screenshot = screenshot;
    player.verificationStatus = 'pending';
    match.status = 'verification';
    await match.save();
    
    res.json(match);
  } catch (error) {
    res.status(400).json({ message: 'Error submitting screenshot', error: error.message });
  }
});

// Update match lifecycle status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body; // matching | matched | playing | verification | finished
    console.log('[updateStatus] user=%s matchId=%s status=%s', req.user?._id, req.params.id, status);
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    const isParticipant = match.players.some(p => String(p.user) === String(req.user._id));
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

    switch (status) {
      case 'matching':
        match.matchmakingStatus = 'searching';
        match.status = 'scheduled';
        break;
      case 'matched':
        match.matchmakingStatus = 'matched';
        match.status = 'scheduled';
        break;
      case 'playing':
        match.matchmakingStatus = 'matched';
        match.status = 'inProgress';
        break;
      case 'verification':
        match.status = 'verification';
        break;
      case 'finished':
        match.status = 'completed';
        break;
      default:
        return res.status(400).json({ message: 'Invalid status' });
    }

    await match.save();
    const populated = await Match.findById(match._id)
      .populate('players.user', 'username avatar')
      .lean();
    res.json({ ...populated, matchStatus: computeMatchStatus(populated) });
  } catch (error) {
    console.error('[updateStatus][error]', error);
    res.status(400).json({ message: 'Error updating status', error: error.message });
  }
});

module.exports = router;
