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

// Helper to get public userId (short id) from DB
async function getPublicUserId(mongoUserId) {
  const u = await User.findById(mongoUserId).select('userId').lean();
  return u?.userId;
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
    
    // Prevent matching with yourself
    if (String(playerId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot match with yourself' });
    }
    // Invite flow: do NOT add player yet. Store pendingInviteUser and emit invite.
    if (match.players.length >= 2) {
      return res.status(400).json({ message: 'Match is full' });
    }
    if (match.matchmakingStatus !== 'searching') {
      return res.status(400).json({ message: 'Match is not available for matching' });
    }
    match.pendingInviteUser = playerId;
    await match.save();
    console.log('[matchWithPlayer] invite sent. matchId=%s invited=%s', match._id, playerId);

    const populatedMatch = await Match.findById(match._id)
      .populate('players.user', 'username avatar');

    const io = req.app.locals.io;
    const matchRoom = `match:${match._id}`;
    try {
      const ownerPublicId = await getPublicUserId(match.players[0].user);
      const targetPublicId = await getPublicUserId(playerId);
      if (ownerPublicId) {
        io.to(`user:${ownerPublicId}`).emit('match:invite:sent', { matchId: String(match._id), matchRoom });
      }
      if (targetPublicId) {
        io.to(`user:${targetPublicId}`).emit('match:invite', { matchId: String(match._id), matchRoom, match: populatedMatch });
      }
    } catch (e) {
      console.error('[socket][matchWithPlayer] emit error', e);
    }

    res.json({
      action: 'invite_sent',
      matchRoom,
      match: populatedMatch,
      targetPlayer: playerId
    });
  } catch (error) {
    console.error('[matchWithPlayer][error]', error);
    res.status(400).json({ message: 'Error matching with player', error: error.message });
  }
});

// Decline an invite and restore match to searching (removes player B)
router.post('/:id/decline', auth, async (req, res) => {
  try {
    console.log('[decline] user=%s matchId=%s', req.user?._id, req.params.id);
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Decline allowed if user is pending invite or already in slot B
    const isPendingInvite = match.pendingInviteUser && String(match.pendingInviteUser) === String(req.user._id);
    const isPlayerB = match.players[1] && String(match.players[1].user) === String(req.user._id);
    if (!isPendingInvite && !isPlayerB) return res.status(403).json({ message: 'Forbidden' });

    // Restore state
    if (isPlayerB) {
      match.players = [ match.players[0] ];
    }
    match.pendingInviteUser = null;
    match.matchmakingStatus = 'searching';
    match.status = 'scheduled';
    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('players.user', 'username avatar');

    // Notify both players
    const io = req.app.locals.io;
    const matchRoom = `match:${match._id}`;
    try {
      const ownerPublicId = await getPublicUserId(match.players[0].user);
      const declinerPublicId = await getPublicUserId(req.user._id);
      if (ownerPublicId) {
        io.to(`user:${ownerPublicId}`).emit('match:declined', { matchId: String(match._id), matchRoom, match: populatedMatch });
      }
      if (declinerPublicId) {
        io.to(`user:${declinerPublicId}`).emit('match:declined:self', { matchId: String(match._id), matchRoom, match: populatedMatch });
      }
      // Optionally clear prior room membership
      io.socketsLeave(matchRoom);
    } catch (e) {
      console.error('[socket][decline] emit error', e);
    }

    res.json({ action: 'declined', matchRoom, match: populatedMatch });
  } catch (error) {
    console.error('[decline][error]', error);
    res.status(400).json({ message: 'Error declining match', error: error.message });
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
    
    // Allow join only if this user is the pending invite, or match open (searching with explicit invite)
    if (match.matchmakingStatus !== 'searching') {
      return res.status(400).json({ message: 'Match is not available for joining' });
    }
    if (match.pendingInviteUser && String(match.pendingInviteUser) !== String(req.user._id)) {
      return res.status(403).json({ message: 'This match is currently inviting another player' });
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
    match.pendingInviteUser = null;
    await match.save();
    console.log('[join] joined. matchId=%s players=%d', match._id, match.players.length);
    
    const populatedMatch = await Match.findById(match._id)
      .populate('players.user', 'username avatar');

    const io = req.app.locals.io;
    const matchRoom = `match:${match._id}`;
    try {
      const ownerPublicId = await getPublicUserId(match.players[0].user);
      const joinerPublicId = await getPublicUserId(req.user._id);
      if (ownerPublicId) {
        io.to(`user:${ownerPublicId}`).emit('match:matched', { matchId: String(match._id), matchRoom, match: populatedMatch });
        io.in(`user:${ownerPublicId}`).socketsJoin(matchRoom);
      }
      if (joinerPublicId) {
        io.to(`user:${joinerPublicId}`).emit('match:joined', { matchId: String(match._id), matchRoom, match: populatedMatch });
        io.in(`user:${joinerPublicId}`).socketsJoin(matchRoom);
      }
    } catch (e) {
      console.error('[socket][join] emit error', e);
    }
    
    res.json({
      action: 'joined',
      matchRoom,
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

    const io = req.app.locals.io;
    const matchRoom = `match:${newMatch._id}`;
    try {
      const ownerPublicId = await getPublicUserId(req.user._id);
      if (ownerPublicId) {
        io.to(`user:${ownerPublicId}`).emit('match:created', { matchId: String(newMatch._id), matchRoom, match: populatedMatch });
        io.in(`user:${ownerPublicId}`).socketsJoin(matchRoom);
      }
    } catch (e) {
      console.error('[socket][create] emit error', e);
    }
    
    res.json({
      action: 'created',
      matchRoom,
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
    const { screenshot } = req.body; // For now, just a placeholder/confirmation
    console.log('[screenshot] user=%s matchId=%s', req.user?._id, req.params.id);
    
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    
    console.log('[screenshot] match players:', match.players.map(p => ({ userId: p.user._id, userStr: String(p.user._id) })));
    console.log('[screenshot] current user:', req.user._id, 'as string:', String(req.user._id));
    
    // Check if user is a participant in this match
    const isParticipant = match.players.some(p => String(p.user._id) === String(req.user._id));
    console.log('[screenshot] isParticipant:', isParticipant);
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    
    // Check if match is in verification phase
    if (match.status !== 'verification') {
      console.log('[screenshot] match status:', match.status);
      return res.status(400).json({ message: 'Match is not in verification phase' });
    }
    
    // Check if verification window has expired
    if (match.verification.expiresAt && new Date() > match.verification.expiresAt) {
      return res.status(400).json({ message: 'Verification window has expired' });
    }
    
    // Find the player in the match
    const playerIndex = match.players.findIndex(p => String(p.user._id) === String(req.user._id));
    console.log('[screenshot] playerIndex:', playerIndex);
    if (playerIndex === -1) return res.status(400).json({ message: 'Player not found in match' });
    
    // Update player's screenshot status
    match.players[playerIndex].screenshot = 'submitted'; // Placeholder for now
    match.players[playerIndex].verificationStatus = 'pending';
    
    await match.save();
    
    // Check if both players have submitted screenshots
    const bothSubmitted = match.players.every(p => p.screenshot === 'submitted');
    if (bothSubmitted) {
      match.verification.status = 'pending';
      await match.save();
    }
    
    const populatedMatch = await Match.findById(match._id)
      .populate('players.user', 'username avatar')
      .lean();
    
    // Emit screenshot submission to all participants
    const io = req.app.locals.io;
    if (io) {
      io.to(`match:${req.params.id}`).emit('match:screenshot:submitted', {
        matchId: req.params.id,
        playerId: req.user._id,
        playerIndex,
        bothSubmitted,
        match: populatedMatch
      });
    }
    
    res.json({ 
      success: true, 
      playerIndex,
      bothSubmitted,
      match: populatedMatch 
    });
  } catch (error) {
    console.error('[screenshot] error:', error);
    res.status(500).json({ message: 'Error submitting screenshot', error: error.message });
  }
});

// Get verification status
router.get('/:id/verification', auth, async (req, res) => {
  try {
    console.log('[getVerification] user=%s matchId=%s', req.user?._id, req.params.id);
    
    const match = await Match.findById(req.params.id)
      .populate('players.user', 'username avatar')
      .select('players verification status');
    
    if (!match) return res.status(404).json({ message: 'Match not found' });
    
    // Check if user is a participant in this match
    const isParticipant = match.players.some(p => String(p.user._id) === String(req.user._id));
    console.log('[getVerification] isParticipant:', isParticipant);
    console.log('[getVerification] match players:', match.players.map(p => ({ userId: p.user._id, userStr: String(p.user._id) })));
    console.log('[getVerification] current user:', req.user._id, 'as string:', String(req.user._id));
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    
    res.json({ 
      verification: match.verification,
      players: match.players.map(p => ({
        userId: p.user._id,
        username: p.user.username,
        screenshot: p.screenshot,
        verificationStatus: p.verificationStatus
      }))
    });
  } catch (error) {
    console.error('[getVerification] error:', error);
    res.status(500).json({ message: 'Error fetching verification status', error: error.message });
  }
});

// Update match lifecycle status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body; // matching | matched | playing | verification | finished
    console.log('[updateStatus] user=%s matchId=%s status=%s', req.user?._id, req.params.id, status);
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    
    const isParticipant = match.players.some(p => String(p.user._id) === String(req.user._id));
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    
    // Check if user is Player A (creator) for start/end game actions
    const isPlayerA = match.players[0] && String(match.players[0].user) === String(req.user._id);
    const isPlayerB = match.players[1] && String(match.players[1].user) === String(req.user._id);
    
    // Only Player A can start or end the game
    if ((status === 'playing' || status === 'verification') && !isPlayerA) {
      return res.status(403).json({ message: 'Only the match creator can start or end the game' });
    }

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
        match.startTime = new Date(); // Set actual start time
        break;
      case 'verification':
        match.status = 'verification';
        match.endTime = new Date(); // Set actual end time
        // Set verification timer (3 minutes)
        match.verification.startedAt = new Date();
        match.verification.expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
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
    const payload = { ...populated, matchStatus: computeMatchStatus(populated) };
    try {
      const io = req.app.locals.io;
      io.to(`match:${match._id}`).emit('match:status', { matchId: String(match._id), status: payload.matchStatus, match: payload });
    } catch (e) {
      console.error('[socket][status] emit error', e);
    }
    res.json(payload);
  } catch (error) {
    console.error('[updateStatus][error]', error);
    res.status(400).json({ message: 'Error updating status', error: error.message });
  }
});

// Send chat message
router.post('/:id/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    console.log('[chat] user=%s matchId=%s message=%s', req.user?._id, req.params.id, message);
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    if (message.length > 200) {
      return res.status(400).json({ message: 'Message too long (max 200 characters)' });
    }
    
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    
    // Check if user is a participant in this match
    const isParticipant = match.players.some(p => String(p.user._id) === String(req.user._id));
    console.log('[chat] isParticipant:', isParticipant);
    console.log('[chat] match players:', match.players.map(p => ({ userId: p.user._id, userStr: String(p.user._id) })));
    console.log('[chat] current user:', req.user._id, 'as string:', String(req.user._id));
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    
    // Add message to chat array
    const chatMessage = {
      user: req.user._id,
      message: message.trim(),
      timestamp: new Date()
    };
    
    match.chat.push(chatMessage);
    await match.save();
    
    // Emit chat message to all participants in the match room
    const io = req.app.locals.io;
    if (io) {
      io.to(`match:${req.params.id}`).emit('match:chat', {
        matchId: req.params.id,
        message: {
          id: chatMessage._id || Date.now().toString(),
          user: {
            _id: req.user._id,
            username: req.user.username,
            avatar: req.user.avatar
          },
          message: chatMessage.message,
          timestamp: chatMessage.timestamp
        }
      });
    }
    
    res.json({ success: true, message: chatMessage });
  } catch (error) {
    console.error('[chat] error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get chat messages for a match
router.get('/:id/chat', auth, async (req, res) => {
  try {
    console.log('[getChat] user=%s matchId=%s', req.user?._id, req.params.id);
    
    const match = await Match.findById(req.params.id)
      .populate('chat.user', 'username avatar')
      .select('chat players');
    
    if (!match) return res.status(404).json({ message: 'Match not found' });
    
    // Check if user is a participant in this match
    const isParticipant = match.players.some(p => String(p.user._id) === String(req.user._id));
    console.log('[getChat] isParticipant:', isParticipant);
    console.log('[getChat] match players:', match.players.map(p => ({ userId: p.user._id, userStr: String(p.user._id) })));
    console.log('[getChat] current user:', req.user._id, 'as string:', String(req.user._id));
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    
    res.json({ messages: match.chat });
  } catch (error) {
    console.error('[getChat] error:', error);
    res.status(500).json({ message: 'Error fetching chat messages', error: error.message });
  }
});

module.exports = router;
