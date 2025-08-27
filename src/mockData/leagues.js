const mockLeagues = [
  {
    id: '1',
    name: 'CODM Pro League Season 1',
    game: 'codm',
    format: 'group_stage',
    status: 'registration_open',
    participants: 12,
    maxParticipants: 16,
    startDate: '2025-09-01',
    endDate: '2025-09-30',
    prizePool: 5000,
    description: 'Professional Call of Duty Mobile tournament with group stages and playoffs',
    requirements: ['Minimum Rank: Master', 'Level 30+'],
    registrationDeadline: '2025-08-31'
  },
  {
    id: '2',
    name: 'FIFA Ultimate Championship',
    game: 'fifa',
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
