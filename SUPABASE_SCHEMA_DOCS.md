# Supabase Database Schema Documentation

**Project:** EUROPEAN FC Betting Platform  
**Generated:** 2026-05-18  
**Status:** Production Ready

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Table Specifications](#table-specifications)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Setup Instructions](#setup-instructions)
6. [Important Notes](#important-notes)

---

## Overview

This schema is designed for a sports betting platform with the following key features:

- **User Authentication & Management** - Firebase Auth with Supabase user profiles
- **Betting System** - Match listings and user-placed bets
- **Multi-level Referral Program** - 3-level affiliate system
- **Wallet Management** - Support for crypto and traditional payment methods
- **Transaction Tracking** - Deposits, withdrawals, and bonus notifications
- **VIP System** - Tiered membership based on spending and referrals

---

## Database Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                 │
│  Firebase Auth (Email/Password) + Supabase Users Table  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼─────────┐  ┌──────▼──────────┐  ┌────▼──────────┐
│   USER PROFILE  │  │  WALLET MGMT    │  │   REFERRALS   │
│   (users)       │  │  (user_wallets) │  │  (referral)   │
│   (wallets)     │  │  (walle)        │  │  (users.refer)│
└─────────────────┘  └─────────────────┘  └────────────────┘
        │
        │
┌───────▼──────────────────────────────────────────────────┐
│                    BETTING SYSTEM                        │
│  Matches (bets) → Placed Bets (placed) → Results        │
└───────────────────────────────────────────────────────────┘
        │
        │
┌───────▼──────────────────────────────────────────────────┐
│                   TRANSACTIONS & BONUSES                 │
│  Notifications (notification) → Activity Log (activa)    │
└───────────────────────────────────────────────────────────┘
```

---

## Table Specifications

### 1. **users** (Main User Table)
**Purpose:** Store user account information and balances

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-generated unique ID |
| userid | TEXT | UNIQUE, NOT NULL | Firebase UID |
| uid | TEXT | UNIQUE, NOT NULL | Custom user identifier |
| username | TEXT | UNIQUE, NOT NULL | Username for login |
| email | TEXT | UNIQUE, NOT NULL | Email address |
| password | TEXT | - | Encrypted password (optional if using Firebase) |
| phone | TEXT | - | Phone number with country code |
| countrycode | TEXT | DEFAULT '+1' | Country dialing code |
| balance | DECIMAL(15,4) | DEFAULT 0.00 | Current account balance in USDT |
| totald | DECIMAL(15,4) | DEFAULT 0.00 | Total deposited amount |
| refer | TEXT | FK → users.newrefer | Direct referrer's newrefer code |
| newrefer | TEXT | UNIQUE, NOT NULL | Unique referral code for this user |
| lvla | TEXT | FK → users.newrefer | Level 2 referrer (referrer's referrer) |
| lvlb | TEXT | FK → users.newrefer | Level 3 referrer (referrer's referrer's referrer) |
| viplevel | INTEGER | DEFAULT 1 | VIP tier (1-7) |
| codeset | BOOLEAN | DEFAULT FALSE | Whether 2FA/PIN is enabled |
| pin | TEXT | - | Transaction PIN |
| firstd | BOOLEAN | DEFAULT FALSE | Whether user made first deposit |
| dailywl | DECIMAL(15,4) | DEFAULT 0.00 | Legacy daily withdrawal tracking |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:** username, email, newrefer, refer, created_at

---

### 2. **bets** (Available Matches)
**Purpose:** Store match information for betting

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | - |
| match_id | TEXT | UNIQUE, NOT NULL | Unique match identifier |
| home | TEXT | NOT NULL | Home team name |
| away | TEXT | NOT NULL | Away team name |
| league | TEXT | - | League name (e.g., "Premier League") |
| otherl | TEXT | - | Alternative league name if league='others' |
| date | TEXT | - | Match date |
| time | TEXT | - | Match kick-off time |
| tsgmt | BIGINT | - | Timestamp in GMT (in milliseconds) |
| verified | BOOLEAN | DEFAULT FALSE | Whether match result is verified |
| results | TEXT | - | Final result (e.g., 'home_win', 'away_win', 'draw') |
| company | BOOLEAN | DEFAULT FALSE | Whether this is a verified company match |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Indexes:** match_id, verified, tsgmt

---

### 3. **placed** (User Placed Bets)
**Purpose:** Track all bets placed by users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | - |
| betid | TEXT | UNIQUE, NOT NULL | Unique bet ID |
| username | TEXT | NOT NULL, FK | Username of the bettor |
| match_id | TEXT | NOT NULL, FK | Reference to bets table |
| home | TEXT | - | Home team name (denormalized) |
| away | TEXT | - | Away team name (denormalized) |
| stake | DECIMAL(15,4) | NOT NULL | Bet amount in USDT |
| aim | DECIMAL(15,4) | NOT NULL | Potential winnings |
| profit | DECIMAL(15,4) | DEFAULT 0.00 | Calculated profit/commission |
| market | TEXT | - | Betting market chosen (e.g., 'home_win') |
| odd | DECIMAL(5,2) | - | Odds percentage |
| won | TEXT | DEFAULT 'null' | Bet result: 'true'=won, 'false'=lost, 'null'=pending |
| date | TEXT | - | Bet placement date |
| time | TEXT | - | Bet placement time |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Indexes:** username, match_id, won, betid, created_at

---

### 4. **user_wallets** (User Payment Methods)
**Purpose:** Store user's linked wallets for deposits/withdrawals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | - |
| uid | TEXT | NOT NULL, FK | User ID reference |
| walletnames | TEXT | NOT NULL | Wallet name/alias (e.g., 'Main Wallet') |
| wallet | TEXT | NOT NULL | Wallet address/account number |
| bank | TEXT | - | Bank name (for bank transfers) or crypto name |
| names | TEXT | - | Account holder name |
| method | TEXT | - | Payment method type (crypto/local) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |
| UNIQUE(uid, walletnames) | - | - | One wallet name per user |

**Indexes:** uid, walletnames

---

### 5. **notification** (Transactions Log)
**Purpose:** Track all deposit/withdraw transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | - |
| username | TEXT | NOT NULL, FK | Username |
| amount | DECIMAL(15,4) | NOT NULL | Transaction amount |
| type | TEXT | - | 'deposit' or 'withdraw' |
| method | TEXT | - | Payment method used |
| bank | TEXT | - | Bank or wallet type |
| address | TEXT | - | Wallet address (for crypto) or bank reference |
| accountname | TEXT | - | Account holder name |
| adminaddress | TEXT | - | Admin wallet reference |
| sent | TEXT | DEFAULT 'pending' | Status: 'pending', 'success', 'failed' |
| time | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Transaction timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Indexes:** username, type, sent, created_at

---

### 6. **activa** (Bonus/Commission Log)
**Purpose:** Track bonuses and affiliate commissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | - |
| code | TEXT | - | Bonus type: 'depbonus', 'affbonus', 'broadcast', 'bet' |
| username | TEXT | FK | Username receiving bonus |
| amount | DECIMAL(15,4) | - | Bonus amount in USDT |
| type | TEXT | - | Type of activity triggering bonus |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Indexes:** code, username, type

---

### 7. **admin_settings** (Admin Platform Settings)
**Purpose:** Store admin-configurable platform values

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK id = 1 | Singleton settings row |
| first_deposit_bonus_percent | DECIMAL(6,3) | DEFAULT 3.000, CHECK 0-100 | Bonus percentage applied to first approved deposit |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last settings update time |

**Seed row:**

```sql
INSERT INTO admin_settings (id, first_deposit_bonus_percent)
VALUES (1, 3.000)
ON CONFLICT (id) DO NOTHING;
```

---

### 8. **referral** (Referral Tracking)
**Purpose:** Track referral program data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | - |
| refer | TEXT | UNIQUE, NOT NULL, FK | Referrer's unique code |
| count | INTEGER | DEFAULT 0 | Number of referrals |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Indexes:** refer

---

### 8. **walle** (Payment Methods)
**Purpose:** List available payment methods/wallets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | - |
| name | TEXT | UNIQUE, NOT NULL | Method name (e.g., 'TRC20', 'Bitcoin') |
| available | BOOLEAN | DEFAULT TRUE | Whether this method is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Indexes:** name

---

## Relationships & Foreign Keys

### Referral Chain
```
User A (refer=NULL) 
  ↓ (refers B)
User B (refer=A.newrefer, lvla=NULL)
  ↓ (refers C)
User C (refer=B.newrefer, lvla=A.newrefer)
  ↓ (refers D)
User D (refer=C.newrefer, lvla=B.newrefer, lvlb=A.newrefer)
```

### Betting Flow
```
User (placed bet) → Match (bets table)
                         ↓
                    Match verified
                         ↓
                    Update placed.won
                         ↓
                    Notify user (activa/notification)
```

### VIP System
Based on `users.totald` and referral count:
- **Level 1:** totald ≥ 50 OR 5+ referrals
- **Level 2:** totald ≥ 100 OR 10+ referrals
- **Level 3:** totald ≥ 200 OR 15+ referrals
- **Level 4:** totald ≥ 300 OR 20+ referrals
- **Level 5:** totald ≥ 500 OR 30+ referrals
- **Level 6:** totald ≥ 1000 OR 40+ referrals
- **Level 7:** totald ≥ 5000 OR 500+ referrals

---

## Setup Instructions

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details (name, password, region)
4. Wait for project to be created

### Step 2: Execute SQL Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy the contents of `supabase_schema.sql`
4. Paste into the editor
5. Click **"Run"** or press `Ctrl+Enter`
6. Verify all tables are created

### Step 3: Verify Tables
```sql
-- Check all tables created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Step 4: Enable Authentication
1. Go to **Authentication** → **Providers**
2. Enable **Email/Password** provider
3. Configure sign-up settings as needed

### Step 5: Get Connection Details
1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (supabaseUrl)
   - **anon public** key (supabaseKey)
3. Update in your code (`pages/api/supabase.js`):
```javascript
const supabaseUrl = 'YOUR_PROJECT_URL'
const supabaseKey = 'YOUR_ANON_KEY'
```

### Step 6: Optional - Enable Row Level Security
If you want to restrict data access:
```sql
-- Uncomment the RLS section in the schema file
-- Run the RLS policies
```

---

## Important Notes

### ⚠️ Security Considerations

1. **Never expose service role key** in frontend - use anon key only
2. **Enable RLS (Row Level Security)** in production
3. **Validate all inputs** on backend before inserting to database
4. **Hash passwords** using bcrypt before storing
5. **Use environment variables** for sensitive data

### 💡 Best Practices

1. **Always use transactions** for multi-table operations
2. **Implement proper error handling** for all DB operations
3. **Use indexes** on frequently queried columns (already included)
4. **Regular backups** - enable automated backups in Supabase
5. **Monitor database** - check usage in Supabase dashboard

### 🔄 Migration from Firebase

If migrating from Firebase Realtime DB:
1. Export data from Firebase
2. Transform to match schema format
3. Import using Supabase Data Editor or custom script
4. Verify data integrity

### 📊 VIP Calculation

The VIP level is calculated based on:
- **Total Deposited Amount** (`users.totald`)
- **Number of First-time Deposit Referrals** (users with `refer=your_code` AND `firstd=true`)

Update the calculation logic in `pages/api/vipcalculate.js` if thresholds change.

### 🔐 PIN & 2FA

Users can set a transaction PIN (`users.pin`):
1. User sets PIN in settings
2. Set `codeset = true` when PIN is created
3. Validate PIN before withdrawal operations

### 💰 Withdrawal Limits

Withdrawals currently require a minimum amount of 5 USDT. There is no maximum withdrawal amount or VIP-based daily withdrawal cap enforced by the app.

### 📱 Supported Payment Methods

Pre-configured in `walle` table:
- TRC20 (Tether on Tron)
- Bitcoin
- Ethereum
- Bank Transfer
- PayPal
- M-Pesa
- GCash

Add more by inserting into `walle` table.

---

## Common Queries

### Get User with Referral Stats
```sql
SELECT 
  u.username,
  u.balance,
  u.viplevel,
  COUNT(DISTINCT ur.id) as referral_count,
  SUM(ur.balance) as referral_total_balance
FROM users u
LEFT JOIN users ur ON ur.refer = u.newrefer
WHERE u.username = 'username'
GROUP BY u.id, u.username, u.balance, u.viplevel;
```

### Get User's Recent Bets
```sql
SELECT * FROM placed 
WHERE username = 'username'
ORDER BY created_at DESC
LIMIT 10;
```

### Get Pending Transactions
```sql
SELECT * FROM notification 
WHERE sent = 'pending'
ORDER BY created_at DESC;
```

### Calculate Affiliate Bonuses
```sql
SELECT 
  username,
  SUM(amount) as total_bonus,
  COUNT(*) as transaction_count
FROM activa
WHERE code IN ('depbonus', 'affbonus')
GROUP BY username
ORDER BY total_bonus DESC;
```

---

## Support & Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/overview)

---

**Last Updated:** 2026-05-18  
**Version:** 1.0 Production
