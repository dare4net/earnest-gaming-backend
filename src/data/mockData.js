const mockUsers = [
  {
    id: '1',
    username: 'ProGamer123',
    email: 'progamer@example.com',
    walletBalance: 500,
    matchesPlayed: 150,
    winRate: 0.68
  },
  {
    id: '2',
    username: 'GamingMaster',
    email: 'master@example.com',
    walletBalance: 750,
    matchesPlayed: 200,
    winRate: 0.72
  }
];

const mockLeagues = [
  {
    id: '1',
    name: 'CODM Pro League',
    gameType: 'codm',
    format: 'group_stage',
    participants: 8,
    maxParticipants: 16,
    prizePool: 1000,
    status: 'registration_open',
    startDate: '2025-09-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'FIFA Champions Cup',
    gameType: 'fifa',
    format: 'single_elimination',
    participants: 16,
    maxParticipants: 16,
    prizePool: 2000,
    status: 'in_progress',
    startDate: '2025-08-15T00:00:00Z'
  }
];

const mockMatches = [
  {
    id: '1',
    gameType: 'codm',
    player1: mockUsers[0],
    player2: mockUsers[1],
    wagerAmount: 50,
    status: 'in_progress',
    startTime: '2025-08-27T15:00:00Z'
  }
];

const mockTransactions = [
  {
    id: '1',
    userId: '1',
    type: 'deposit',
    amount: 100,
    status: 'completed',
    timestamp: '2025-08-26T10:00:00Z'
  },
  {
    id: '2',
    userId: '1',
    type: 'wager',
    amount: -50,
    status: 'completed',
    timestamp: '2025-08-26T11:00:00Z'
  }
];

module.exports = {
  mockUsers,
  mockLeagues,
  mockMatches,
  mockTransactions
};
