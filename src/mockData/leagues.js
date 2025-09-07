const mockLeagues = [
  {
    id: "league-001",
    name: "Pro FIFA Championship",
    description: "Elite FIFA tournament for top players",
    gameType: "FIFA",
    tournamentFormat: "knockout",
    maxParticipants: 32,
    participants: 28,
    entryFee: 25,
    prizePool: 1000,
    registrationStart: "2024-01-15T00:00:00Z",
    registrationEnd: "2024-02-15T00:00:00Z",
    tournamentStart: "2024-02-20T00:00:00Z",
    status: "registration_open",
    requirements: ["Minimum Level 20", "Positive Win Rate"],
    gameIcon: "⚽"
  },
  {
    id: "league-002",
    name: "CODM Masters League",
    description: "Professional CODM tournament series",
    gameType: "CODM",
    format: 'single_elimination',
    status: 'in_progress',
    participants: 32,
    maxParticipants: 32,
    startDate: '2025-08-15',
    endDate: '2025-09-15',
    prizePool: 10000,
    description: 'Premier FIFA tournament featuring the best players',
    requirements: ['Division 3 or higher', '100+ matches played'],
    registrationDeadline: '2025-08-14'
  }
];

module.exports = mockLeagues;
