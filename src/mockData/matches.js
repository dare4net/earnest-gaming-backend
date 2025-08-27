const mockMatches = [
  {
    id: '1',
    gameId: 'codm',
    type: 'ranked',
    status: 'in_progress',
    player1: {
      id: '1',
      username: 'ProGamer123'
    },
    player2: {
      id: '2',
      username: 'GameMaster99'
    },
    wagerAmount: 50,
    startTime: '2025-08-27T14:30:00Z',
    gameMode: 'multiplayer',
    settings: {
      mode: 'Team Deathmatch',
      map: 'Nuketown',
      scoreLimit: 50
    }
  },
  {
    id: '2',
    gameId: 'fifa',
    type: 'tournament',
    status: 'completed',
    player1: {
      id: '1',
      username: 'ProGamer123',
      score: 3
    },
    player2: {
      id: '3',
      username: 'SoccerKing',
      score: 1
    },
    winner: '1',
    startTime: '2025-08-27T12:00:00Z',
    endTime: '2025-08-27T12:24:00Z',
    tournamentId: '1',
    round: 'quarter-final'
  }
];

module.exports = mockMatches;
