## Earnest Gaming Backend API

- Base URL: `http://<host>:<port>/api` (dev: `http://localhost:5000/api`)
- Auth: `Authorization: Bearer <JWT>` on protected endpoints
- RBAC:
  - Admin only: Create/Update/Delete leagues
  - Auth required: Match creation; all wallet endpoints
  - Self-access: Users may only access their own wallet/transactions (admin can access any)

Errors return JSON:
```json
{ "message": "Error message", "error": "Optional details" }
```

---

### Auth

POST /auth/register
- Body: { "username": string, "email": string, "password": string, "selectedGames": string[] }
- 201 Response: { success: boolean, user: { id, username, email, avatar, role, selectedGames }, token }

POST /auth/login
- Body: { "email": string, "password": string }
- 200 Response: { success: boolean, user: { id, username, email, avatar, role, wins, winRate, earnings, selectedGames }, token }

GET /auth/me
- Auth: required
- 200 Response: Full user object without password

POST /auth/logout
- Auth: required
- 200 Response: { message }

PATCH /auth/profile
- Auth: required
- Body: Partial of { username, email, avatar }
- 200 Response: Updated user (without password)

---

### Games

GET /games
- 200 Response: Game[]

GET /games/:id
- 200 Response: Game

GET /games/:id/players
- 200 Response: { playersOnline: number } (placeholder value)

Game shape (simplified):
```json
{
  "_id": string,
  "title": string,
  "slug": string,
  "description": string,
  "coverImage": string,
  "platform": "Mobile"|"Console"|"PC",
  "minEntryFee": number,
  "maxEntryFee": number,
  "status": "active"|"inactive"|"maintenance",
  "rules": string[],
  "matchFormat": "1v1"|"2v2"|"3v3"|"4v4"|"5v5"
}
```

---

### Leagues

GET /leagues
- 200 Response: League[] (populates `game`, `participants.user`, `matches`)

GET /leagues/:id
- 200 Response: League (populates `game`, `participants.user`, `matches`)

POST /leagues
- Auth: admin
- Body: { name, game: gameId, description, startDate, endDate, entryFee, prizePool, maxParticipants, format, rules: string[] }
- 201 Response: Created league

PUT /leagues/:id
- Auth: admin
- Body: Partial league fields
- 200 Response: Updated league

DELETE /leagues/:id
- Auth: admin
- 204 Response: no content

League shape (simplified):
```json
{
  "_id": string,
  "name": string,
  "game": { "_id": string, "title": string, "slug": string },
  "description": string,
  "startDate": string,
  "endDate": string,
  "entryFee": number,
  "prizePool": number,
  "maxParticipants": number,
  "participants": [
    { "user": { "_id": string, "username": string, "avatar": string }, "status": "registered"|"verified"|"disqualified", "points": number, "position": number|null, "joinedAt": string }
  ],
  "format": "knockout"|"roundRobin"|"groupStage",
  "status": "upcoming"|"registration"|"inProgress"|"completed"|"cancelled",
  "matches": string[],
  "rules": string[]
}
```

---

### Matches

GET /matches
- 200 Response: Match[] (populates `game`, `league`, `players.user`)

GET /matches/:id
- 200 Response: Match (populates `game`, `league`, `players.user`)

GET /matches/user/:userId
- 200 Response: Match[] for the user (populates `game`, `league`, `players.user`)

POST /matches
- Auth: required
- Body: { game: gameId, league?: leagueId, players: [{ user: userId, team: "A"|"B" }...], startTime: string, entryFee: number, prizePool: number, format: "1v1"|"2v2"|..., rules: string[] }
- 201 Response: Created match

Match shape (simplified):
```json
{
  "_id": string,
  "game": { "_id": string, "title": string, "slug": string },
  "league": { "_id": string, "name": string }|null,
  "players": [
    { "user": { "_id": string, "username": string, "avatar": string }, "team": "A"|"B", "status": "pending"|"ready"|"playing"|"disconnected"|"finished", "score": number, "screenshot": string|null, "verificationStatus": "pending"|"approved"|"rejected" }
  ],
  "startTime": string,
  "endTime": string|null,
  "status": "scheduled"|"inProgress"|"verification"|"disputed"|"completed"|"cancelled",
  "winner": string|null,
  "entryFee": number,
  "prizePool": number,
  "format": "1v1"|"2v2"|"3v3"|"4v4"|"5v5",
  "rules": string[]
}
```

---

### Users

GET /users
- 200 Response: User[] (sanitized; no password)

GET /users/leaderboard
- 200 Response: Top users sorted by `wins` then `winRate`

GET /users/:id
- 200 Response: User (sanitized; no password)

GET /users/:id/stats
- 200 Response: { matchesPlayed: number, winRate: number, earnings: number }

User shape (sanitized excerpt):
```json
{ "_id": string, "username": string, "email": string, "avatar": string, "wins": number, "winRate": number, "earnings": number, "rank": number, "previousRank": number, "role": "user"|"admin" }
```

---

### Wallet & Transactions

GET /wallet/user/:userId
- Auth: required (self or admin)
- 200 Response: Wallet

GET /wallet/user/:userId/transactions
- Auth: required (self or admin)
- 200 Response: Transaction[] (sorted desc by createdAt)

POST /wallet/transaction
- Auth: required (self or admin when acting on `userId`)
- Body: { userId: string, type: "deposit"|"withdrawal"|"matchEntry"|"matchWin"|"leagueEntry"|"leaguePrize"|"refund", amount: number, currency?: "NGN"|string, paymentMethod?: "bank"|"card"|"ussd"|"transfer"|"system", description?: string }
- Notes:
  - For `deposit`: balance increases; `totalDeposited` updated
  - For `withdrawal`: balance decreases (must have sufficient balance); `totalWithdrawn` updated
  - Other types: balance adjusted by `amount` (positive or negative)
- 201 Response: Created transaction with balanceBefore/balanceAfter and unique `reference`

Wallet shape (excerpt):
```json
{ "_id": string, "user": string, "balance": number, "currency": string, "status": "active"|"frozen"|"suspended", "totalDeposited": number, "totalWithdrawn": number, "totalWinnings": number }
```

Transaction shape (excerpt):
```json
{ "_id": string, "user": string, "type": string, "amount": number, "currency": string, "status": "pending"|"processing"|"completed"|"failed"|"cancelled", "reference": string, "description": string, "paymentMethod": string, "balanceBefore": number, "balanceAfter": number, "createdAt": string }
```

---

### Authentication Notes for Frontend

- Store `token` from `/auth/login` or `/auth/register` in local storage and include as `Authorization: Bearer <token>` on protected routes.
- Use `/auth/me` to hydrate the current user on app load.
- Handle 401 by clearing token and redirecting to login.

### Common Status Codes

- 200: Success
- 201: Created
- 204: No Content (delete)
- 400: Bad request/validation
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient role or accessing another user's wallet)
- 404: Not found
- 500: Server error


