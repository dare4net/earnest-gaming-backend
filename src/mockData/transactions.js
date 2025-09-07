const transactions = [
  {
    id: "tx-001",
    userId: "1",
    type: "deposit",
    amount: 100,
    status: "completed",
    timestamp: "2024-01-20T10:00:00Z",
    method: "credit_card"
  },
  {
    id: "tx-002",
    userId: "2",
    type: "withdraw",
    amount: 250,
    status: "pending",
    timestamp: "2024-01-20T09:30:00Z",
    method: "bank_transfer"
  },
  {
    id: "tx-003",
    userId: "1",
    type: "wager",
    amount: 50,
    status: "completed",
    timestamp: "2024-01-20T08:45:00Z",
    matchId: "match-001"
  }
];

module.exports = transactions;
