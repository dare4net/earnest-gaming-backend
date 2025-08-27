const mockWallets = [
  {
    userId: '1',
    balance: 500,
    transactions: [
      {
        id: '1',
        type: 'deposit',
        amount: 100,
        status: 'completed',
        timestamp: '2025-08-26T10:00:00Z'
      },
      {
        id: '2',
        type: 'wager',
        amount: -50,
        status: 'completed',
        matchId: '1',
        timestamp: '2025-08-27T14:30:00Z'
      }
    ]
  },
  {
    userId: '2',
    balance: 1200,
    transactions: [
      {
        id: '3',
        type: 'deposit',
        amount: 500,
        status: 'completed',
        timestamp: '2025-08-25T15:00:00Z'
      },
      {
        id: '4',
        type: 'withdrawal',
        amount: -200,
        status: 'pending',
        timestamp: '2025-08-27T16:00:00Z'
      }
    ]
  }
];

module.exports = mockWallets;
