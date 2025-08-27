const mockGames = [
  {
    id: 'codm',
    name: 'Call of Duty Mobile',
    shortName: 'CODM',
    icon: '🎯',
    modes: ['multiplayer', 'battle-royale', 'ranked-mp'],
    status: 'active',
    minWager: 10,
    maxWager: 500,
    playersOnline: 4100,
    description: 'Competitive mobile shooting game with various game modes',
    requirements: ['Level 10+', 'Verified Account'],
    matchDuration: '8-10 minutes'
  },
  {
    id: 'fifa',
    name: 'FIFA 24',
    shortName: 'FIFA',
    icon: '⚽',
    modes: ['1v1', 'tournaments'],
    status: 'active',
    minWager: 5,
    maxWager: 1000,
    playersOnline: 2800,
    description: 'Premier football simulation game',
    requirements: ['Level 5+', 'Verified Account'],
    matchDuration: '12 minutes'
  },
  {
    id: 'efootball',
    name: 'eFootball 2024',
    shortName: 'EFB',
    icon: '⚽',
    modes: ['1v1', 'tournaments'],
    status: 'active',
    minWager: 5,
    maxWager: 500,
    playersOnline: 1500,
    description: 'Free-to-play football simulation',
    requirements: ['Level 3+', 'Verified Account'],
    matchDuration: '10 minutes'
  }
];

module.exports = mockGames;
