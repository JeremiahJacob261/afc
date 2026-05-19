# Database Entity Relationship Diagram (ERD)

## Visual Schema Representation

```
╔════════════════════════════════════════════════════════════════════════════╗
║                         BRADFORD FC DATABASE SCHEMA                        ║
╚════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────┐
│           USERS (Main Account)           │
├──────────────────────────────────────────┤
│ PK  id                                   │
│ UQ  userId (Firebase UID)                │
│ UQ  uid (Custom UID)                     │
│ UQ  username                             │
│ UQ  email                                │
│     password                             │
│     phone                                │
│     countrycode                          │
│     balance          [USDT]              │
│     totald           [Total Deposited]   │
│ FK  refer            ──────┐             │
│ UQ  newrefer              │             │
│ FK  lvla             ─────┤             │
│ FK  lvlb             ─────┤             │
│     viplevel                             │
│     codeset          [2FA enabled?]      │
│     pin              [Transaction PIN]   │
│     firstd           [First deposit?]    │
│     dailywl          [Daily withdrawal]  │
│     created_at                           │
│     updated_at                           │
└──────┬──────────────────┬────────────────┘
       │                  │
       │ (1:N) self-ref   │ (1:N) self-ref
       │ via refer        │ via lvla/lvlb
       │                  │
       ├──────────────────┤
       │
       │
    ┌──┴────────────────────────────────────────┐
    │                                           │
    │                                           │
    ▼                                           ▼
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│      USER_WALLETS (1:N)         │  │   REFERRAL (1:1)             │
├─────────────────────────────────┤  ├──────────────────────────────┤
│ PK  id                          │  │ PK  id                       │
│ FK  uid ────────────────────┐   │  │ FK  refer ───────────────┐   │
│ UQ  walletnames (per user)  │   │  │     count [referrals]    │   │
│     wallet                  │   │  │     created_at           │   │
│     bank                    │   │  └──────────────────────────┘   │
│     names                   │   │         │                       │
│     method [crypto/local]   │   │         │                       │
│     created_at              │   │         │ (1:N)                 │
└─────────────────────────────┘   │         │                       │
                                  │         │                       │
                                  │         └── (self-ref)          │
                                  │              users.newrefer     │
                                  │                                 │
                                  └─────────────────────────────────┘


┌──────────────────────────────────────────┐
│        WALLE (Payment Methods)           │
├──────────────────────────────────────────┤
│ PK  id                                   │
│ UQ  name [TRC20, Bitcoin, etc]           │
│     available [active?]                  │
│     created_at                           │
└──────────────────────────────────────────┘


┌──────────────────────────────────────┐
│    BETS (Available Matches)           │
├──────────────────────────────────────┤
│ PK  id                               │
│ UQ  match_id                         │
│     home [home team]                 │
│     away [away team]                 │
│     league                           │
│     otherl [alternative league]      │
│     date                             │
│     time                             │
│     tsgmt [timestamp GMT]            │
│     verified [result published?]     │
│     results [home_win/away_win/draw] │
│     company [verified match?]        │
│     created_at                       │
│     updated_at                       │
└────────────┬──────────────────────────┘
             │
             │ (1:N)
             │
             ▼
┌──────────────────────────────────────────────────────┐
│          PLACED (User Placed Bets)                   │
├──────────────────────────────────────────────────────┤
│ PK  id                                               │
│ UQ  betid                                            │
│ FK  username ──────────────────────────┐             │
│ FK  match_id ─────────────────┐        │             │
│     home [denormalized]       │        │             │
│     away [denormalized]       │        │             │
│     stake [bet amount USDT]   │        │             │
│     aim [potential winnings]  │        │             │
│     profit [calculated]       │        │             │
│     market [bet type]         │        │             │
│     odd [odds %]              │        │             │
│     won [true/false/null]     │        │             │
│     date                      │        │             │
│     time                      │        │             │
│     created_at                │        │             │
│     updated_at                │        │             │
└──────────────────────────────┬┴────────┘             │
                              │                        │
                              └────────────────────────┘
                                    (FK refs)


┌──────────────────────────────────────────────────┐
│    NOTIFICATION (Deposit/Withdraw Log)           │
├──────────────────────────────────────────────────┤
│ PK  id                                           │
│ FK  username ────────────────────────────┐       │
│     amount [transaction amount USDT]     │       │
│     type [deposit/withdraw]              │       │
│     method [TRC20, Bank, etc]            │       │
│     bank [bank name or crypto name]      │       │
│     address [wallet address]             │       │
│     accountname [account holder]         │       │
│     adminaddress [admin wallet ref]      │       │
│     sent [pending/success/failed]        │       │
│     time [transaction timestamp]         │       │
│     created_at                           │       │
└──────────────────┬───────────────────────┘       │
                   │                                │
                   └────────────────────────────────┘
                         (FK ref)


┌──────────────────────────────────────────────────┐
│    ACTIVA (Bonus/Commission Activity Log)        │
├──────────────────────────────────────────────────┤
│ PK  id                                           │
│     code [depbonus/affbonus/broadcast/bet]       │
│ FK  username ────────────────────────────┐       │
│     amount [bonus amount USDT]           │       │
│     type [bonus type]                    │       │
│     created_at                           │       │
└──────────────────┬───────────────────────┘       │
                   │                                │
                   └────────────────────────────────┘
                         (FK ref)
```

---

## Relationship Summary

### One-to-Many (1:N) Relationships

| Parent | Child | Foreign Key | Description |
|--------|-------|-------------|-------------|
| users | placed | username | User places multiple bets |
| users | user_wallets | uid | User can link multiple wallets |
| users | notification | username | User has multiple transactions |
| users | activa | username | User has multiple bonus records |
| users | users (self) | refer | User referrer (1 referrer per user) |
| bets | placed | match_id | Match has multiple bets placed |

### One-to-One (1:1) Relationships

| Table 1 | Table 2 | Relationship | Description |
|---------|---------|--------------|-------------|
| users | referral | newrefer | Each user has one referral tracking record |

### Self-Referential Relationships

| Table | Parent Key | Child Key | Description |
|-------|-----------|-----------|-------------|
| users | refer | newrefer | User's direct referrer |
| users | lvla | newrefer | User's level 2 referrer (grandparent) |
| users | lvlb | newrefer | User's level 3 referrer (great-grandparent) |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                         │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
         ┌────────────┐
         │   USERS    │ (Insert new user)
         └────────────┘
              │
              │ (Create referral code)
              ▼
         ┌────────────┐
         │ REFERRAL   │ (count = 0 initially)
         └────────────┘


┌─────────────────────────────────────────────────────────────┐
│                    DEPOSIT FLOW                              │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
         ┌─────────────────────┐
         │  USER_WALLETS       │ (User selects payment method)
         │  ↓ Uses wallet from │
         └─────────────────────┘
              │
              ▼
         ┌────────────┐
         │NOTIFICATION│ (Deposit request: status=pending)
         └────────────┘
              │
         (Admin approves)
              │
              ▼
         ┌────────────────────────┐
         │ UPDATE:                │
         │ - users.balance += amt │
         │ - users.totald += amt  │
         │ - NOTIFICATION.sent=ok │
         └────────────────────────┘
              │
              ▼
         ┌────────────┐
         │   ACTIVA   │ (Bonus recorded: depbonus)
         └────────────┘


┌─────────────────────────────────────────────────────────────┐
│                  PLACE BET FLOW                              │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────┐
    │  Check:                 │
    │  - Match exists (BETS)   │
    │  - User balance >= stake │
    │  - Match not started     │
    └────────┬────────────────┘
             │
             ▼
    ┌────────────────┐
    │ INSERT PLACED  │ (New bet, won=null)
    └────────┬───────┘
             │
             ▼
    ┌──────────────────────┐
    │ UPDATE users:        │
    │ balance -= stake     │
    └──────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                  SETTLE BET FLOW                             │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────┐
    │ Admin verifies match    │
    │ results in BETS table   │
    │ (verified=true)         │
    └────────┬────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ RPC function settles all:      │
    │ - Compare bet market vs result │
    │ - Update placed.won (T/F)      │
    │ - Update users.balance (win)   │
    │ - Create ACTIVA bonus (if won) │
    └────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                  REFERRAL BONUS FLOW                         │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────┐
    │ Referred user deposits       │
    │ (new user: firstd = false)   │
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │ After approval:              │
    │ 1. Update REFERRAL.count++   │
    │ 2. Create ACTIVA records:    │
    │    - For referrer (affbonus) │
    │    - For level 2 (affbonus)  │
    │    - For level 3 (affbonus)  │
    │ 3. Update users.balance      │
    │ 4. Update users.firstd=true  │
    └──────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                   WITHDRAW FLOW                              │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
    ┌────────────────────────┐
    │ Check:                 │
    │ - Balance sufficient   │
    │ - 5+ bets placed       │
    │ - PIN correct          │
    │ - Daily limit ok       │
    └────────┬───────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ INSERT NOTIFICATION         │
    │ (type=withdraw, sent=pending)
    │ - 93% sent, 7% fee retained │
    └────────┬────────────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │ RPC functions:               │
    │ - dailywl (track daily)      │
    │ - withdrawer (deduct balance)│
    └──────────────────────────────┘
             │
         (Admin processes payment)
             │
             ▼
    ┌──────────────────────────────┐
    │ UPDATE NOTIFICATION          │
    │ sent = 'success' OR 'failed'  │
    └──────────────────────────────┘
```

---

## Data Dependencies & Constraints

### User Creation Prerequisites
- Firebase authentication required first
- Unique `userId` from Firebase
- Generate unique `newrefer` code
- Optional: `refer` code from referrer

### Bet Placement Prerequisites
- User must exist in `users` table
- Match must exist in `bets` table
- User balance ≥ stake amount
- Match time not yet started (tsgmt > now)

### Deposit Requirements
- User must have at least one `user_wallet` entry
- Selected wallet must be in `walle` table and `available=true`

### Withdrawal Requirements
- User must have at least 5 placed bets
- User PIN must be set (`codeset=true`)
- Balance sufficient after fee (7% deducted)
- Daily withdrawal limit not exceeded

### VIP Level Calculation
- Based on `users.totald` (total deposited) AND
- Based on first-time deposit referrals count

---

## Cardinality Matrix

```
                users  placed  bets  notification  user_wallets  referral  activa  walle
                ─────  ──────  ────  ─────────────  ────────────  ────────  ──────  ─────
users            1:N   1:N     -     1:N          1:N            1:1       1:N     -
placed          N:1    -       N:1   -            -              -         -       -
bets             -     N:1     -     -            -              -         -       -
notification    N:1    -       -     -            -              -         -       -
user_wallets    N:1    -       -     -            -              -         -       N:1
referral        1:1    -       -     -            -              -         -       -
activa          N:1    -       -     -            -              -         -       -
walle            -     -       -     -            N:1            -         -       -
```

---

## Key Constraints Summary

| Constraint Type | Table | Column(s) | Rule |
|-----------------|-------|-----------|------|
| Primary Key | All | id | Unique identifier |
| Unique | users | userId, uid, username, email, newrefer | No duplicates |
| Unique | bets | match_id | One per match |
| Unique | placed | betid | One per placed bet |
| Unique | user_wallets | (uid, walletnames) | One wallet name per user |
| Unique | referral | refer | One per referrer |
| Unique | walle | name | One per payment method |
| Foreign Key | users | refer → users.newrefer | Valid referrer |
| Foreign Key | users | lvla → users.newrefer | Valid L2 referrer |
| Foreign Key | users | lvlb → users.newrefer | Valid L3 referrer |
| Foreign Key | placed | username → users.username | Valid user |
| Foreign Key | placed | match_id → bets.match_id | Valid match |
| Foreign Key | user_wallets | uid → users.uid | Valid user |
| Foreign Key | notification | username → users.username | Valid user |
| Foreign Key | activa | username → users.username | Valid user |
| Foreign Key | referral | refer → users.newrefer | Valid user |

---

## SQL Join Examples

### User with Their Bets
```sql
SELECT 
  u.username,
  p.betid,
  p.stake,
  p.aim,
  p.won
FROM users u
INNER JOIN placed p ON u.username = p.username
WHERE u.username = 'john_doe'
ORDER BY p.created_at DESC;
```

### Match with All Placed Bets
```sql
SELECT 
  b.match_id,
  b.home,
  b.away,
  COUNT(p.betid) as total_bets,
  SUM(p.stake) as total_staked
FROM bets b
LEFT JOIN placed p ON b.match_id = p.match_id
WHERE b.verified = false
GROUP BY b.id, b.match_id, b.home, b.away;
```

### User Referral Network
```sql
SELECT 
  u1.username as user,
  u2.username as referrer,
  u3.username as level2_referrer,
  COUNT(DISTINCT p.betid) as user_bets
FROM users u1
LEFT JOIN users u2 ON u1.refer = u2.newrefer
LEFT JOIN users u3 ON u1.lvla = u3.newrefer
LEFT JOIN placed p ON u1.username = p.username
WHERE u1.username = 'john_doe'
GROUP BY u1.id, u2.id, u3.id;
```

### Pending Transactions
```sql
SELECT 
  n.id,
  n.username,
  n.amount,
  n.type,
  n.method,
  n.created_at
FROM notification n
WHERE n.sent = 'pending'
ORDER BY n.created_at ASC;
```

---

## View: User Summary

The schema includes a pre-built view for quick user analytics:

```sql
SELECT * FROM user_summary WHERE username = 'john_doe';
```

Returns:
- username
- email
- balance
- totald (total deposited)
- viplevel
- total_bets
- won_bets
- lost_bets
- referral_count
- created_at

---

**Diagram Version:** 1.0  
**Last Updated:** 2026-05-18
