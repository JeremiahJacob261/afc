-- Supabase Database Schema for EUROPEAN FC Betting Platform
-- Generated: 2026-05-18
-- This schema matches the application structure used in the Next.js project

-- ============================================================================
-- AUTH & USER MANAGEMENT TABLES
-- ============================================================================

-- Main users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  userid TEXT UNIQUE NOT NULL,
  uid TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  phone TEXT,
  countrycode TEXT DEFAULT '+1',
  balance DECIMAL(15, 4) DEFAULT 0.00,
  totald DECIMAL(15, 4) DEFAULT 0.00,
  -- Referral system
  refer TEXT,
  newrefer TEXT UNIQUE NOT NULL,
  lvla TEXT,
  lvlb TEXT,
  viplevel INTEGER DEFAULT 1,
  -- User settings
  codeset BOOLEAN DEFAULT FALSE,
  pin TEXT,
  firstd BOOLEAN DEFAULT FALSE,
  dailywl DECIMAL(15, 4) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (refer) REFERENCES users(newrefer),
  FOREIGN KEY (lvla) REFERENCES users(newrefer),
  FOREIGN KEY (lvlb) REFERENCES users(newrefer)
);

-- User wallet bindings
CREATE TABLE IF NOT EXISTS user_wallets (
  id BIGSERIAL PRIMARY KEY,
  uid TEXT NOT NULL,
  walletnames TEXT NOT NULL,
  wallet TEXT NOT NULL,
  bank TEXT,
  names TEXT,
  method TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(uid, walletnames),
  FOREIGN KEY (uid) REFERENCES users(uid)
);

-- ============================================================================
-- BETTING & MATCHES TABLES
-- ============================================================================

-- Available matches for betting
CREATE TABLE IF NOT EXISTS bets (
  id BIGSERIAL PRIMARY KEY,
  match_id TEXT UNIQUE NOT NULL,
  home TEXT NOT NULL,
  away TEXT NOT NULL,
  league TEXT,
  otherl TEXT,
  date TEXT,
  time TEXT,
  tsgmt BIGINT,
  verified BOOLEAN DEFAULT FALSE,
  results TEXT,
  company BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Placed bets by users
CREATE TABLE IF NOT EXISTS placed (
  id BIGSERIAL PRIMARY KEY,
  betid TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  match_id TEXT NOT NULL,
  home TEXT,
  away TEXT,
  stake DECIMAL(15, 4) NOT NULL,
  aim DECIMAL(15, 4) NOT NULL,
  profit DECIMAL(15, 4) DEFAULT 0.00,
  market TEXT,
  odd DECIMAL(5, 2),
  won TEXT DEFAULT 'null',
  date TEXT,
  time TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (match_id) REFERENCES bets(match_id)
);

-- ============================================================================
-- TRANSACTION & NOTIFICATION TABLES
-- ============================================================================

-- Transaction notifications (deposit/withdraw)
CREATE TABLE IF NOT EXISTS notification (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  amount DECIMAL(15, 4) NOT NULL,
  type TEXT,
  method TEXT,
  bank TEXT,
  address TEXT,
  accountname TEXT,
  adminaddress TEXT,
  sent TEXT DEFAULT 'pending',
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username)
);

-- Activity log (bonuses, affiliate commissions, etc.)
CREATE TABLE IF NOT EXISTS activa (
  id BIGSERIAL PRIMARY KEY,
  code TEXT,
  username TEXT,
  amount DECIMAL(15, 4),
  type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username)
);

-- ============================================================================
-- REFERRAL & AFFILIATE TABLES
-- ============================================================================

-- Referral tracking
CREATE TABLE IF NOT EXISTS referral (
  id BIGSERIAL PRIMARY KEY,
  refer TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (refer) REFERENCES users(newrefer)
);

-- ============================================================================
-- PAYMENT METHOD TABLES
-- ============================================================================

-- Available wallet/payment methods
CREATE TABLE IF NOT EXISTS walle (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_newrefer ON users(newrefer);
CREATE INDEX IF NOT EXISTS idx_users_refer ON users(refer);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Bets indexes
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_verified ON bets(verified);
CREATE INDEX IF NOT EXISTS idx_bets_tsgmt ON bets(tsgmt);

-- Placed bets indexes
CREATE INDEX IF NOT EXISTS idx_placed_username ON placed(username);
CREATE INDEX IF NOT EXISTS idx_placed_match_id ON placed(match_id);
CREATE INDEX IF NOT EXISTS idx_placed_won ON placed(won);
CREATE INDEX IF NOT EXISTS idx_placed_betid ON placed(betid);
CREATE INDEX IF NOT EXISTS idx_placed_created_at ON placed(created_at);

-- User wallets indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_uid ON user_wallets(uid);
CREATE INDEX IF NOT EXISTS idx_user_wallets_walletnames ON user_wallets(walletnames);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_username ON notification(username);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
CREATE INDEX IF NOT EXISTS idx_notification_sent ON notification(sent);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at);

-- Activa indexes
CREATE INDEX IF NOT EXISTS idx_activa_code ON activa(code);
CREATE INDEX IF NOT EXISTS idx_activa_username ON activa(username);
CREATE INDEX IF NOT EXISTS idx_activa_type ON activa(type);

-- Referral indexes
CREATE INDEX IF NOT EXISTS idx_referral_refer ON referral(refer);

-- ============================================================================
-- VIEWS (Optional - for common queries)
-- ============================================================================

-- User summary view
CREATE OR REPLACE VIEW user_summary AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.balance,
  u.totald,
  u.viplevel,
  COUNT(DISTINCT p.betid) as total_bets,
  SUM(CASE WHEN p.won = 'true' THEN 1 ELSE 0 END) as won_bets,
  SUM(CASE WHEN p.won = 'false' THEN 1 ELSE 0 END) as lost_bets,
  COUNT(DISTINCT CASE WHEN r.refer = u.newrefer THEN r.refer END) as referral_count,
  u.created_at
FROM users u
LEFT JOIN placed p ON u.username = p.username
LEFT JOIN referral r ON u.newrefer = r.refer
GROUP BY u.id, u.username, u.email, u.balance, u.totald, u.viplevel, u.created_at;

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) - Optional
-- ============================================================================
-- Enable RLS if needed (uncomment below)
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE placed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activa ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own records
CREATE POLICY "Users see own data" ON users
  FOR SELECT USING (auth.uid()::text = userid);
*/

-- ============================================================================
-- RECOMMENDED RLS HARDENING FOR SUPABASE AUTH
-- ============================================================================
-- Run this after verifying users.userid contains auth.users.id values.
-- Service-role API routes bypass RLS for trusted server-side operations.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE placed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = userid);

DROP POLICY IF EXISTS "Users can update own profile settings" ON users;
CREATE POLICY "Users can update own profile settings" ON users
  FOR UPDATE
  USING (auth.uid()::text = userid)
  WITH CHECK (auth.uid()::text = userid);

DROP POLICY IF EXISTS "Users can read own bets" ON placed;
CREATE POLICY "Users can read own bets" ON placed
  FOR SELECT
  USING (
    username IN (
      SELECT username FROM users WHERE userid = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can read own notifications" ON notification;
CREATE POLICY "Users can read own notifications" ON notification
  FOR SELECT
  USING (
    username IN (
      SELECT username FROM users WHERE userid = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can read own wallets" ON user_wallets;
CREATE POLICY "Users can read own wallets" ON user_wallets
  FOR SELECT
  USING (
    uid IN (
      SELECT userid FROM users WHERE userid = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert own wallets" ON user_wallets;
CREATE POLICY "Users can insert own wallets" ON user_wallets
  FOR INSERT
  WITH CHECK (
    uid IN (
      SELECT userid FROM users WHERE userid = auth.uid()::text
    )
  );

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Insert default payment methods
INSERT INTO walle (name, available) VALUES
  ('TRC20', true),
  ('Bitcoin', true),
  ('Ethereum', true),
  ('Bank Transfer', true),
  ('PayPal', true),
  ('M-Pesa', true),
  ('GCash', true)
ON CONFLICT (name) DO NOTHING;
