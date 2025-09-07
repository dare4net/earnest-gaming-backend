const mockMatches = [
  {
    id: "match-001",
    game: "eFootball",
    gameIcon: "⚽",
    players: ["ProGamer123", "SkillMaster99"],
    wagerAmount: 50,
    status: "active",
    startTime: "2024-01-20T10:30:00Z",
    duration: "15 min"
  },
  {
    id: "match-002",
    game: "FIFA",
    gameIcon: "🏆",
    players: ["ChampionPlayer", "NewbieGamer"],
    wagerAmount: 75,
    status: "verification",
    startTime: "2024-01-20T10:15:00Z",
    duration: "12 min"
  },
  {
    id: "match-003",
    game: "CODM",
    gameIcon: "🎯",
    players: ["SniperElite", "BattleRoyale"],
    wagerAmount: 100,
    status: "completed",
    startTime: "2024-01-20T09:45:00Z",
    duration: "8 min",
    winner: "SniperElite"
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
