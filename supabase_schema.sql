-- Supabase Database Schema for EUROPEAN FC Betting Platform
-- Generated: 2026-05-18
-- This schema matches the application structure used in the Next.js project

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- ============================================================================
-- SCHEDULED JOBS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'reset-users-gcount-daily-utc'
  ) THEN
    PERFORM cron.unschedule('reset-users-gcount-daily-utc');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'apply-vip-daily-rewards-utc'
  ) THEN
    PERFORM cron.unschedule('apply-vip-daily-rewards-utc');
  END IF;
END $$;

SELECT cron.schedule(
  'reset-users-gcount-daily-utc',
  '0 0 * * *',
  $$UPDATE public.users SET gcount = 0 WHERE gcount IS DISTINCT FROM 0;$$
);

SELECT cron.schedule(
  'apply-vip-daily-rewards-utc',
  '0 0 * * *',
  $$SELECT public.apply_vip_daily_rewards();$$
);

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
  gcount INTEGER DEFAULT 0,
  dailywl DECIMAL(15, 4) DEFAULT 0.00,
  betspend DECIMAL(15, 4) DEFAULT 0.00,
  betwon DECIMAL(15, 4) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (refer) REFERENCES users(newrefer),
  FOREIGN KEY (lvla) REFERENCES users(newrefer),
  FOREIGN KEY (lvlb) REFERENCES users(newrefer)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS betspend DECIMAL(15, 4) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS betwon DECIMAL(15, 4) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit DECIMAL(15, 4) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totalw DECIMAL(15, 4) DEFAULT 0.00;

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

-- Fixture source table populated from API-Football for admin match selection
CREATE TABLE IF NOT EXISTS upcoming_matches (
  id BIGINT PRIMARY KEY,
  league TEXT,
  home_name TEXT,
  away_name TEXT,
  home_logo TEXT,
  away_logo TEXT,
  hour TEXT,
  minute TEXT,
  date DATE,
  day INTEGER,
  month INTEGER,
  timest TIMESTAMPTZ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Available matches for betting
CREATE TABLE IF NOT EXISTS bets (
  id BIGSERIAL PRIMARY KEY,
  match_id TEXT UNIQUE NOT NULL,
  home TEXT NOT NULL,
  away TEXT NOT NULL,
  league TEXT,
  otherl TEXT,
  ihome TEXT,
  iaway TEXT,
  date TEXT,
  time TEXT,
  tsgmt BIGINT,
  nilnil DECIMAL(8, 3),
  onenil DECIMAL(8, 3),
  nilone DECIMAL(8, 3),
  oneone DECIMAL(8, 3),
  twonil DECIMAL(8, 3),
  niltwo DECIMAL(8, 3),
  twoone DECIMAL(8, 3),
  onetwo DECIMAL(8, 3),
  twotwo DECIMAL(8, 3),
  threenil DECIMAL(8, 3),
  nilthree DECIMAL(8, 3),
  threeone DECIMAL(8, 3),
  onethree DECIMAL(8, 3),
  twothree DECIMAL(8, 3),
  threetwo DECIMAL(8, 3),
  threethree DECIMAL(8, 3),
  otherscores DECIMAL(8, 3),
  fourfour DECIMAL(8, 3),
  hd DECIMAL(8, 3),
  ha DECIMAL(8, 3),
  da DECIMAL(8, 3),
  verified BOOLEAN DEFAULT FALSE,
  results TEXT,
  company BOOLEAN DEFAULT FALSE,
  comarket TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Placed bets by users
CREATE TABLE IF NOT EXISTS placed (
  id BIGSERIAL PRIMARY KEY,
  betid TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT NOT NULL,
  username TEXT NOT NULL,
  match_id TEXT NOT NULL,
  home TEXT,
  away TEXT,
  ihome TEXT,
  iaway TEXT,
  stake DECIMAL(15, 4) NOT NULL,
  aim DECIMAL(15, 4) NOT NULL,
  profit DECIMAL(15, 4) DEFAULT 0.00,
  market TEXT,
  odd DECIMAL(5, 2),
  won TEXT DEFAULT 'null',
  started BOOLEAN DEFAULT FALSE,
  levelone TEXT,
  leveltwo TEXT,
  levelthree TEXT,
  aone DECIMAL(15, 4) DEFAULT 0.00,
  atwo DECIMAL(15, 4) DEFAULT 0.00,
  athree DECIMAL(15, 4) DEFAULT 0.00,
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
  uid TEXT,
  sent TEXT DEFAULT 'pending',
  processed_action TEXT,
  processed_at TIMESTAMP,
  processing_started_at TIMESTAMP,
  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username)
);

ALTER TABLE notification ADD COLUMN IF NOT EXISTS uid TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processed_action TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Native/mobile push tokens. Server APIs use service_role; RLS below also
-- protects direct Data API access if enabled for authenticated clients.
CREATE TABLE IF NOT EXISTS push_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  device_id TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT push_tokens_language_check CHECK (language IN ('en', 'fr', 'es', 'my', 'ru', 'ar')),
  FOREIGN KEY (username) REFERENCES users(username)
);

ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'android';
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE push_tokens ALTER COLUMN language SET DEFAULT 'en';
UPDATE push_tokens
SET language = 'en'
WHERE language IS NULL
  OR language NOT IN ('en', 'fr', 'es', 'my', 'ru', 'ar');
ALTER TABLE push_tokens ALTER COLUMN language SET NOT NULL;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE push_tokens DROP CONSTRAINT IF EXISTS push_tokens_language_check;
ALTER TABLE push_tokens
  ADD CONSTRAINT push_tokens_language_check
  CHECK (language IN ('en', 'fr', 'es', 'my', 'ru', 'ar'));

-- Canonical app notification feed used by native push and the in-app bell.
CREATE TABLE IF NOT EXISTS app_notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_username TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_table TEXT,
  source_id TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_username) REFERENCES users(username)
);

ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS recipient_username TEXT;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS source_table TEXT;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

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

-- Idempotent audit ledger for daily VIP balance increases.
CREATE TABLE IF NOT EXISTS vip_daily_rewards (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  reward_date DATE NOT NULL,
  vip_level INTEGER NOT NULL,
  daily_rate DECIMAL(8, 6) NOT NULL,
  balance_before DECIMAL(15, 4) NOT NULL,
  amount DECIMAL(15, 4) NOT NULL,
  balance_after DECIMAL(15, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, reward_date),
  FOREIGN KEY (username) REFERENCES users(username)
);

CREATE INDEX IF NOT EXISTS idx_vip_daily_rewards_date ON vip_daily_rewards(reward_date);

CREATE TABLE IF NOT EXISTS useractivity (
  id BIGSERIAL PRIMARY KEY,
  type TEXT,
  amount DECIMAL(15, 4),
  "user" TEXT,
  count INTEGER DEFAULT 0,
  uid TEXT,
  match_id TEXT,
  stake DECIMAL(15, 4),
  profit DECIMAL(15, 4),
  market TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin-configurable platform settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  first_deposit_bonus_percent DECIMAL(6, 3) NOT NULL DEFAULT 3.000 CHECK (
    first_deposit_bonus_percent >= 0
    AND first_deposit_bonus_percent <= 100
  ),
  min_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 10.000 CHECK (
    min_withdrawal_amount >= 0
  ),
  max_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 100000.000 CHECK (
    max_withdrawal_amount >= 0
  ),
  daily_withdrawal_limit DECIMAL(15, 3) NOT NULL DEFAULT 100.000 CHECK (
    daily_withdrawal_limit >= 0
  ),
  withdrawal_limit_exempt_usernames TEXT[] NOT NULL DEFAULT '{}',
  withdrawal_fee_percent DECIMAL(6, 3) NOT NULL DEFAULT 7.000 CHECK (
    withdrawal_fee_percent >= 0
    AND withdrawal_fee_percent <= 100
  ),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_settings (id, first_deposit_bonus_percent, min_withdrawal_amount, max_withdrawal_amount, daily_withdrawal_limit, withdrawal_limit_exempt_usernames, withdrawal_fee_percent)
VALUES (1, 3.000, 10.000, 100000.000, 100.000, '{}', 7.000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(15, 3) NOT NULL DEFAULT 100.000 CHECK (daily_withdrawal_limit >= 0);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawal_limit_exempt_usernames TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS reading (
  id BIGINT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bets DECIMAL(15, 4) DEFAULT 0.00,
  deposit DECIMAL(15, 4) DEFAULT 0.00,
  withdraw DECIMAL(15, 4) DEFAULT 0.00,
  bet DECIMAL(15, 4) DEFAULT 0.00,
  won DECIMAL(15, 4) DEFAULT 0.00
);

INSERT INTO reading (id, bets, deposit, withdraw, bet, won)
VALUES (1, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_impersonation_audit (
  id BIGSERIAL PRIMARY KEY,
  target_userid TEXT,
  target_uid TEXT,
  target_username TEXT,
  target_email TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_upcoming_matches_date ON upcoming_matches(date);
CREATE INDEX IF NOT EXISTS idx_upcoming_matches_timest ON upcoming_matches(timest);
CREATE INDEX IF NOT EXISTS idx_upcoming_matches_home_name ON upcoming_matches(home_name);
CREATE INDEX IF NOT EXISTS idx_upcoming_matches_away_name ON upcoming_matches(away_name);
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
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_limit ON notification(username, created_at) WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer');
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_uid ON notification(uid);
CREATE INDEX IF NOT EXISTS idx_notification_processed_at ON notification(processed_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_username ON push_tokens(username);
CREATE INDEX IF NOT EXISTS idx_push_tokens_enabled ON push_tokens(enabled);

CREATE INDEX IF NOT EXISTS idx_app_notifications_recipient ON app_notifications(recipient_username);
CREATE INDEX IF NOT EXISTS idx_app_notifications_event_type ON app_notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_app_notifications_created_at ON app_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_app_notifications_read_at ON app_notifications(read_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_notifications_source_once
  ON app_notifications(recipient_username, event_type, source_table, source_id)
  WHERE source_table IS NOT NULL AND source_id IS NOT NULL;

-- Activa indexes
CREATE INDEX IF NOT EXISTS idx_activa_code ON activa(code);
CREATE INDEX IF NOT EXISTS idx_activa_username ON activa(username);
CREATE INDEX IF NOT EXISTS idx_activa_type ON activa(type);

CREATE INDEX IF NOT EXISTS idx_useractivity_user ON useractivity("user");
CREATE INDEX IF NOT EXISTS idx_useractivity_match_id ON useractivity(match_id);

-- Admin settings index
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_at ON admin_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_created_at ON admin_impersonation_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_audit_target_uid ON admin_impersonation_audit(target_uid);

-- Referral indexes
CREATE INDEX IF NOT EXISTS idx_referral_refer ON referral(refer);

-- ============================================================================
-- ATOMIC BETTING RPCS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.score_market_key(market_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  raw_value TEXT := btrim(COALESCE(market_value, ''));
  label_value TEXT;
BEGIN
  IF raw_value IN (
    'nilnil', 'onenil', 'nilone', 'oneone', 'twonil', 'niltwo',
    'twoone', 'onetwo', 'twotwo', 'threenil', 'nilthree',
    'threeone', 'onethree', 'twothree', 'threetwo',
    'threethree', 'otherscores'
  ) THEN
    RETURN raw_value;
  END IF;

  label_value := btrim(regexp_replace(raw_value, '\s*:\s*', ' - ', 'g'));

  CASE label_value
    WHEN '0 - 0' THEN RETURN 'nilnil';
    WHEN '1 - 0' THEN RETURN 'onenil';
    WHEN '0 - 1' THEN RETURN 'nilone';
    WHEN '1 - 1' THEN RETURN 'oneone';
    WHEN '2 - 0' THEN RETURN 'twonil';
    WHEN '0 - 2' THEN RETURN 'niltwo';
    WHEN '2 - 1' THEN RETURN 'twoone';
    WHEN '1 - 2' THEN RETURN 'onetwo';
    WHEN '2 - 2' THEN RETURN 'twotwo';
    WHEN '3 - 0' THEN RETURN 'threenil';
    WHEN '0 - 3' THEN RETURN 'nilthree';
    WHEN '3 - 1' THEN RETURN 'threeone';
    WHEN '1 - 3' THEN RETURN 'onethree';
    WHEN '2 - 3' THEN RETURN 'twothree';
    WHEN '3 - 2' THEN RETURN 'threetwo';
    WHEN '3 - 3' THEN RETURN 'threethree';
    WHEN 'Other' THEN RETURN 'otherscores';
    ELSE RETURN NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.score_market_label(market_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  market_key TEXT := public.score_market_key(market_value);
BEGIN
  CASE market_key
    WHEN 'nilnil' THEN RETURN '0 - 0';
    WHEN 'onenil' THEN RETURN '1 - 0';
    WHEN 'nilone' THEN RETURN '0 - 1';
    WHEN 'oneone' THEN RETURN '1 - 1';
    WHEN 'twonil' THEN RETURN '2 - 0';
    WHEN 'niltwo' THEN RETURN '0 - 2';
    WHEN 'twoone' THEN RETURN '2 - 1';
    WHEN 'onetwo' THEN RETURN '1 - 2';
    WHEN 'twotwo' THEN RETURN '2 - 2';
    WHEN 'threenil' THEN RETURN '3 - 0';
    WHEN 'nilthree' THEN RETURN '0 - 3';
    WHEN 'threeone' THEN RETURN '3 - 1';
    WHEN 'onethree' THEN RETURN '1 - 3';
    WHEN 'twothree' THEN RETURN '2 - 3';
    WHEN 'threetwo' THEN RETURN '3 - 2';
    WHEN 'threethree' THEN RETURN '3 - 3';
    WHEN 'otherscores' THEN RETURN 'Other';
    ELSE RETURN NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.score_market_from_score(home_score INTEGER, away_score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  score_label TEXT;
BEGIN
  IF home_score IS NULL OR away_score IS NULL OR home_score < 0 OR away_score < 0 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;

  IF home_score > 3 OR away_score > 3 THEN
    RETURN 'Other';
  END IF;

  score_label := home_score::TEXT || ' - ' || away_score::TEXT;
  IF public.score_market_key(score_label) IS NULL THEN
    RAISE EXCEPTION 'Unsupported score market';
  END IF;

  RETURN score_label;
END;
$$;

CREATE OR REPLACE FUNCTION public.vip_bonus_for_level(vip_level INTEGER)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE vip_level
    WHEN 2 THEN 0.015
    WHEN 3 THEN 0.030
    WHEN 4 THEN 0.050
    WHEN 5 THEN 0.070
    WHEN 6 THEN 0.095
    WHEN 7 THEN 0.125
    ELSE 0
  END::NUMERIC;
$$;

CREATE OR REPLACE FUNCTION public.vip_level_for_user(total_deposit NUMERIC, referral_count INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(total_deposit, 0) >= 500 AND COALESCE(referral_count, 0) >= 20 THEN 7
    WHEN COALESCE(total_deposit, 0) >= 300 AND COALESCE(referral_count, 0) >= 15 THEN 6
    WHEN COALESCE(total_deposit, 0) >= 200 AND COALESCE(referral_count, 0) >= 12 THEN 5
    WHEN COALESCE(total_deposit, 0) >= 100 AND COALESCE(referral_count, 0) >= 8 THEN 4
    WHEN COALESCE(total_deposit, 0) >= 50 AND COALESCE(referral_count, 0) >= 5 THEN 3
    WHEN COALESCE(total_deposit, 0) >= 20 AND COALESCE(referral_count, 0) >= 3 THEN 2
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.vip_daily_rate_for_level(vip_level INTEGER)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE vip_level
    WHEN 2 THEN 0.0015
    WHEN 3 THEN 0.0030
    WHEN 4 THEN 0.0050
    WHEN 5 THEN 0.0070
    WHEN 6 THEN 0.0095
    WHEN 7 THEN 0.0125
    ELSE 0
  END::NUMERIC;
$$;

CREATE OR REPLACE FUNCTION public.apply_vip_daily_rewards(
  p_reward_date DATE DEFAULT (timezone('UTC', now()))::DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_row RECORD;
  reward_id BIGINT;
  vip_level INTEGER;
  daily_rate NUMERIC;
  reward_amount NUMERIC;
  next_balance NUMERIC;
  processed_count INTEGER := 0;
  total_amount NUMERIC := 0;
BEGIN
  FOR user_row IN
    SELECT
      u.id,
      u.username,
      COALESCE(u.totald, 0)::NUMERIC AS total_deposit,
      COALESCE(u.balance, 0)::NUMERIC AS current_balance,
      (
        SELECT COUNT(*)::INTEGER
        FROM users downline
        WHERE downline.refer = u.newrefer
          AND downline.firstd IS TRUE
      ) AS active_downlines
    FROM users u
    FOR UPDATE OF u
  LOOP
    vip_level := public.vip_level_for_user(user_row.total_deposit, user_row.active_downlines);
    daily_rate := public.vip_daily_rate_for_level(vip_level);

    IF daily_rate <= 0 OR user_row.current_balance <= 0 THEN
      CONTINUE;
    END IF;

    reward_amount := round((user_row.current_balance * daily_rate)::NUMERIC, 4);
    IF reward_amount <= 0 THEN
      CONTINUE;
    END IF;

    reward_id := NULL;
    INSERT INTO vip_daily_rewards (
      username,
      reward_date,
      vip_level,
      daily_rate,
      balance_before,
      amount,
      balance_after
    )
    VALUES (
      user_row.username,
      p_reward_date,
      vip_level,
      daily_rate,
      user_row.current_balance,
      reward_amount,
      user_row.current_balance + reward_amount
    )
    ON CONFLICT (username, reward_date) DO NOTHING
    RETURNING id INTO reward_id;

    IF reward_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE users
    SET balance = COALESCE(balance, 0) + reward_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_row.id
    RETURNING balance INTO next_balance;

    UPDATE vip_daily_rewards
    SET balance_after = next_balance
    WHERE id = reward_id;

    INSERT INTO activa (code, username, amount, type)
    VALUES ('vipdaily', user_row.username, reward_amount, 'vipbonus');

    processed_count := processed_count + 1;
    total_amount := total_amount + reward_amount;
  END LOOP;

  RETURN jsonb_build_object(
    'rewardDate', p_reward_date,
    'processedCount', processed_count,
    'totalAmount', round(total_amount::NUMERIC, 4)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.place_bet_atomic(
  p_userid TEXT,
  p_match_id TEXT,
  p_picked TEXT,
  p_stake NUMERIC,
  p_client_bet_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  user_row users%ROWTYPE;
  match_row bets%ROWTYPE;
  market_key TEXT;
  market_label TEXT;
  base_odd NUMERIC;
  final_odd NUMERIC;
  profit_amount NUMERIC;
  next_balance NUMERIC;
  referral_count INTEGER;
  vip_level INTEGER;
  start_ms NUMERIC;
  now_ms NUMERIC;
  inserted_betid TEXT;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_match_id IS NULL OR btrim(p_match_id) = '' THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF p_stake IS NULL OR p_stake < 1 THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;

  market_key := public.score_market_key(p_picked);
  market_label := public.score_market_label(p_picked);
  IF market_key IS NULL OR market_label IS NULL THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;

  SELECT *
  INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF COALESCE(user_row.balance, 0) < p_stake THEN
    RAISE EXCEPTION 'You do not have Enough USDT to Complete this BET';
  END IF;

  IF COALESCE(user_row.gcount, 0) > 2 THEN
    RAISE EXCEPTION 'You have reached the maximum number of bets for today';
  END IF;

  SELECT *
  INTO match_row
  FROM bets
  WHERE match_id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF COALESCE(match_row.verified, FALSE) THEN
    RAISE EXCEPTION 'Match already settled';
  END IF;

  start_ms := COALESCE(match_row.tsgmt, 0);
  IF start_ms > 0 AND start_ms < 1000000000000 THEN
    start_ms := start_ms * 1000;
  END IF;
  now_ms := EXTRACT(EPOCH FROM now()) * 1000;

  IF start_ms <= now_ms THEN
    RAISE EXCEPTION 'This Match has expired';
  END IF;

  base_odd := COALESCE(NULLIF(to_jsonb(match_row) ->> market_key, '')::NUMERIC, 0);
  IF base_odd <= 0 THEN
    RAISE EXCEPTION 'This market is not available';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO referral_count
  FROM users
  WHERE refer = user_row.newrefer
    AND firstd IS TRUE;

  vip_level := public.vip_level_for_user(user_row.totald, referral_count);
  final_odd := base_odd + public.vip_bonus_for_level(vip_level);
  profit_amount := round((final_odd * p_stake) / 100, 2);

  IF p_client_bet_id IS NULL THEN
    INSERT INTO placed (
      match_id, market, username, started, stake, profit, aim,
      home, away, time, date, odd, ihome, iaway,
      levelone, leveltwo, levelthree, aone, atwo, athree
    )
    VALUES (
      match_row.match_id, market_label, user_row.username, FALSE, p_stake, profit_amount, profit_amount,
      match_row.home, match_row.away, match_row.time, match_row.date, final_odd, match_row.ihome, match_row.iaway,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN '7705966' ELSE user_row.refer END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN '7705966' ELSE user_row.lvla END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN '7705966' ELSE user_row.lvlb END,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.05 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN 0 ELSE 0.03 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN 0 ELSE 0.01 * profit_amount END
    )
    RETURNING betid::TEXT INTO inserted_betid;
  ELSE
    INSERT INTO placed (
      betid, match_id, market, username, started, stake, profit, aim,
      home, away, time, date, odd, ihome, iaway,
      levelone, leveltwo, levelthree, aone, atwo, athree
    )
    VALUES (
      p_client_bet_id, match_row.match_id, market_label, user_row.username, FALSE, p_stake, profit_amount, profit_amount,
      match_row.home, match_row.away, match_row.time, match_row.date, final_odd, match_row.ihome, match_row.iaway,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN '7705966' ELSE user_row.refer END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN '7705966' ELSE user_row.lvla END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN '7705966' ELSE user_row.lvlb END,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.05 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN 0 ELSE 0.03 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN 0 ELSE 0.01 * profit_amount END
    )
    ON CONFLICT (betid) DO NOTHING
    RETURNING betid::TEXT INTO inserted_betid;

    IF inserted_betid IS NULL THEN
      SELECT betid::TEXT
      INTO inserted_betid
      FROM placed
      WHERE betid::TEXT = p_client_bet_id::TEXT
        AND username = user_row.username
        AND match_id = match_row.match_id;

      IF inserted_betid IS NULL THEN
        RAISE EXCEPTION 'Duplicate bet id';
      END IF;

      RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Bet Successful',
        'betid', inserted_betid,
        'balance', user_row.balance,
        'profit', profit_amount,
        'odd', final_odd,
        'reused', TRUE
      );
    END IF;
  END IF;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_stake,
      gcount = COALESCE(gcount, 0) + 1
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  INSERT INTO useractivity (type, amount, "user", match_id, stake, profit, market)
  VALUES ('bets', p_stake + profit_amount, user_row.username, match_row.match_id, p_stake, profit_amount, market_label);

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Bet Successful',
    'betid', inserted_betid,
    'balance', next_balance,
    'profit', profit_amount,
    'odd', final_odd
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_reverse_match_atomic(
  p_match_id TEXT,
  p_home_score INTEGER,
  p_away_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  match_row bets%ROWTYPE;
  bet_row placed%ROWTYPE;
  actual_label TEXT;
  actual_key TEXT;
  protected_key TEXT;
  selected_key TEXT;
  payout_amount NUMERIC;
  bonus_amount NUMERIC;
  total_bets INTEGER := 0;
  won_count INTEGER := 0;
  lost_count INTEGER := 0;
  refunded_count INTEGER := 0;
  user_refers RECORD;
BEGIN
  IF p_match_id IS NULL OR btrim(p_match_id) = '' THEN
    RAISE EXCEPTION 'Missing match id';
  END IF;

  actual_label := public.score_market_from_score(p_home_score, p_away_score);
  actual_key := public.score_market_key(actual_label);

  SELECT *
  INTO match_row
  FROM bets
  WHERE match_id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO total_bets
  FROM placed
  WHERE match_id = p_match_id;

  IF COALESCE(match_row.verified, FALSE) THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'alreadySettled', TRUE,
      'matchId', p_match_id,
      'result', match_row.results,
      'resultKey', public.score_market_key(match_row.results),
      'company', COALESCE(match_row.company, FALSE),
      'protectedMarket', public.score_market_label(match_row.comarket),
      'summary', jsonb_build_object('won', 0, 'lost', 0, 'refunded', 0, 'total', total_bets)
    );
  END IF;

  IF COALESCE(match_row.company, FALSE) THEN
    protected_key := public.score_market_key(match_row.comarket);
    IF protected_key IS NULL THEN
      RAISE EXCEPTION 'Company match is missing a supported protected market';
    END IF;
  END IF;

  FOR bet_row IN
    SELECT *
    FROM placed
    WHERE match_id = p_match_id
      AND won = 'null'
    FOR UPDATE
  LOOP
    selected_key := public.score_market_key(bet_row.market);
    IF selected_key IS NULL THEN
      RAISE EXCEPTION 'Unsupported placed market for bet %', bet_row.betid;
    END IF;

    UPDATE users
    SET betspend = COALESCE(betspend, 0) + COALESCE(bet_row.stake, 0)
    WHERE username = bet_row.username;

    IF selected_key <> actual_key THEN
      payout_amount := COALESCE(bet_row.stake, 0) + COALESCE(bet_row.aim, 0);

      UPDATE users
      SET balance = COALESCE(balance, 0) + payout_amount,
          betwon = COALESCE(betwon, 0) + payout_amount
      WHERE username = bet_row.username;

      UPDATE placed
      SET won = 'true'
      WHERE betid = bet_row.betid;

      INSERT INTO activa (code, username, amount, type)
      VALUES ('bet', bet_row.username, payout_amount, 'rebate');

      SELECT refer, lvla, lvlb
      INTO user_refers
      FROM users
      WHERE username = bet_row.username;

      IF user_refers.refer IS NOT NULL AND user_refers.refer <> '' AND user_refers.refer <> 'null' THEN
        bonus_amount := COALESCE(bet_row.profit, 0) * 0.06;
        UPDATE users
        SET balance = COALESCE(balance, 0) + bonus_amount
        WHERE newrefer = user_refers.refer;
        IF FOUND THEN
          INSERT INTO activa (username, type, amount, code)
          VALUES (bet_row.username, 'affbonus', bonus_amount, user_refers.refer);
        END IF;
      END IF;

      IF user_refers.lvla IS NOT NULL AND user_refers.lvla <> '' AND user_refers.lvla <> 'null' THEN
        bonus_amount := COALESCE(bet_row.profit, 0) * 0.03;
        UPDATE users
        SET balance = COALESCE(balance, 0) + bonus_amount
        WHERE newrefer = user_refers.lvla;
        IF FOUND THEN
          INSERT INTO activa (username, type, amount, code)
          VALUES (bet_row.username, 'affbonus', bonus_amount, user_refers.lvla);
        END IF;
      END IF;

      IF user_refers.lvlb IS NOT NULL AND user_refers.lvlb <> '' AND user_refers.lvlb <> 'null' THEN
        bonus_amount := COALESCE(bet_row.profit, 0) * 0.01;
        UPDATE users
        SET balance = COALESCE(balance, 0) + bonus_amount
        WHERE newrefer = user_refers.lvlb;
        IF FOUND THEN
          INSERT INTO activa (username, type, amount, code)
          VALUES (bet_row.username, 'affbonus', bonus_amount, user_refers.lvlb);
        END IF;
      END IF;

      won_count := won_count + 1;
    ELSIF protected_key IS NOT NULL AND protected_key = selected_key THEN
      UPDATE users
      SET balance = COALESCE(balance, 0) + COALESCE(bet_row.stake, 0)
      WHERE username = bet_row.username;

      UPDATE placed
      SET won = 'true'
      WHERE betid = bet_row.betid;

      refunded_count := refunded_count + 1;
    ELSE
      UPDATE placed
      SET won = 'false'
      WHERE betid = bet_row.betid;

      lost_count := lost_count + 1;
    END IF;
  END LOOP;

  UPDATE bets
  SET verified = TRUE,
      results = actual_label
  WHERE match_id = p_match_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'alreadySettled', FALSE,
    'matchId', p_match_id,
    'result', actual_label,
    'resultKey', actual_key,
    'company', COALESCE(match_row.company, FALSE),
    'protectedMarket', CASE WHEN protected_key IS NULL THEN NULL ELSE public.score_market_label(protected_key) END,
    'summary', jsonb_build_object('won', won_count, 'lost', lost_count, 'refunded', refunded_count, 'total', total_bets)
  );
END;
$$;

-- ============================================================================
-- ATOMIC PAYMENT RPCS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_finance_action_atomic(
  p_action TEXT,
  p_id BIGINT DEFAULT NULL,
  p_uid TEXT DEFAULT NULL,
  p_approved_amount NUMERIC DEFAULT NULL,
  p_first_deposit_bonus_percent NUMERIC DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  notification_row notification%ROWTYPE;
  user_row users%ROWTYPE;
  current_sent TEXT;
  normalized_type TEXT;
  final_sent TEXT;
  deposit_amount NUMERIC;
  withdraw_amount NUMERIC;
  refund_amount NUMERIC;
  notification_amount NUMERIC;
  first_deposit_bonus NUMERIC;
  referral_bonus NUMERIC;
  bonus_percent NUMERIC;
BEGIN
  p_action := lower(btrim(COALESCE(p_action, '')));

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid finance action';
  END IF;

  IF p_id IS NULL AND (p_uid IS NULL OR btrim(p_uid) = '') THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF p_id IS NOT NULL THEN
    SELECT *
    INTO notification_row
    FROM notification
    WHERE id = p_id
    FOR UPDATE;
  ELSE
    SELECT *
    INTO notification_row
    FROM notification
    WHERE uid::TEXT = p_uid
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  current_sent := lower(COALESCE(notification_row.sent, 'pending'));
  normalized_type := lower(COALESCE(notification_row.type, ''));

  BEGIN
    notification_amount := NULLIF(notification_row.amount::TEXT, '')::NUMERIC;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid transaction amount';
  END;

  IF current_sent IN ('success', 'true', 'completed') THEN
    IF p_action = 'approve' THEN
      RETURN jsonb_build_object(
        'status', 'success',
        'sent', 'success',
        'alreadyProcessed', TRUE,
        'transactionId', notification_row.id
      );
    END IF;

    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent IN ('failed', 'false') THEN
    IF p_action = 'reject' THEN
      RETURN jsonb_build_object(
        'status', 'success',
        'sent', 'failed',
        'alreadyProcessed', TRUE,
        'transactionId', notification_row.id
      );
    END IF;

    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent = 'processing' THEN
    RAISE EXCEPTION 'Transaction already being processed';
  END IF;

  IF normalized_type NOT IN ('deposit', 'withdraw', 'withdrawer') THEN
    RAISE EXCEPTION 'Unsupported transaction type';
  END IF;

  SELECT *
  INTO user_row
  FROM users
  WHERE username = notification_row.username
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  UPDATE notification
  SET processing_started_at = COALESCE(processing_started_at, now())
  WHERE id = notification_row.id;

  IF p_action = 'reject' THEN
    IF normalized_type IN ('withdraw', 'withdrawer') THEN
      refund_amount := round((COALESCE(notification_amount, 0) / 0.95)::NUMERIC, 3);

      IF refund_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid transaction amount';
      END IF;

      UPDATE users
      SET balance = COALESCE(balance, 0) + refund_amount
      WHERE username = notification_row.username;
    END IF;

    final_sent := 'failed';
  ELSE
    IF p_approved_amount IS NULL OR p_approved_amount <= 0 THEN
      RAISE EXCEPTION 'Invalid transaction amount';
    END IF;

    IF normalized_type = 'deposit' THEN
      deposit_amount := round(p_approved_amount::NUMERIC, 3);
      bonus_percent := COALESCE(p_first_deposit_bonus_percent, 3);

      IF bonus_percent < 0 OR bonus_percent > 100 THEN
        RAISE EXCEPTION 'First deposit bonus percent must be between 0 and 100';
      END IF;

      UPDATE users
      SET balance = COALESCE(balance, 0) + deposit_amount,
          totald = COALESCE(totald, 0) + deposit_amount,
          deposit = COALESCE(deposit, 0) + 1
      WHERE username = notification_row.username;

      UPDATE reading
      SET deposit = COALESCE(deposit, 0) + deposit_amount
      WHERE id = 1;

      IF COALESCE(user_row.firstd, FALSE) IS FALSE THEN
        first_deposit_bonus := round(((deposit_amount * bonus_percent) / 100)::NUMERIC, 3);

        IF first_deposit_bonus > 0 THEN
          UPDATE users
          SET balance = COALESCE(balance, 0) + first_deposit_bonus
          WHERE username = notification_row.username;

          INSERT INTO activa (code, username, type, amount)
          VALUES ('firstdepositbonus', notification_row.username, 'depbonus', first_deposit_bonus);
        END IF;

        referral_bonus := round((deposit_amount * 0.05)::NUMERIC, 3);

        UPDATE users
        SET balance = COALESCE(balance, 0) + referral_bonus
        WHERE newrefer = user_row.refer;

        INSERT INTO activa (username, type, amount, code)
        VALUES (notification_row.username, 'depbonus', referral_bonus, user_row.refer);

        UPDATE users
        SET firstd = TRUE
        WHERE username = notification_row.username;
      END IF;

      INSERT INTO activa (code, username, type, amount)
      VALUES ('finance', notification_row.username, 'deposit', deposit_amount);
    ELSE
      withdraw_amount := round(p_approved_amount::NUMERIC, 3);

      UPDATE users
      SET totalw = COALESCE(totalw, 0) + withdraw_amount
      WHERE username = notification_row.username;

      UPDATE reading
      SET withdraw = COALESCE(withdraw, 0) + withdraw_amount
      WHERE id = 1;

      INSERT INTO activa (code, username, type, amount)
      VALUES ('finance', notification_row.username, 'withdraw', COALESCE(notification_amount, 0));
    END IF;

    final_sent := 'success';
  END IF;

  UPDATE notification
  SET sent = final_sent,
      processed_action = p_action,
      processed_at = now()
  WHERE id = notification_row.id;

  RETURN jsonb_build_object(
    'status', 'success',
    'sent', final_sent,
    'alreadyProcessed', FALSE,
    'transactionId', notification_row.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_withdrawal_request_atomic(
  p_userid TEXT,
  p_amount NUMERIC,
  p_payout_amount NUMERIC,
  p_wallet TEXT DEFAULT NULL,
  p_method TEXT DEFAULT NULL,
  p_bank TEXT DEFAULT NULL,
  p_accountname TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  user_row users%ROWTYPE;
  settings_row admin_settings%ROWTYPE;
  next_balance NUMERIC;
  inserted_id BIGINT;
  daily_total NUMERIC;
  annual_total NUMERIC;
  is_limit_exempt BOOLEAN;
  utc_day_start TIMESTAMP;
  utc_year_start TIMESTAMP;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_payout_amount IS NULL OR p_payout_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT *
  INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- The immutable $100 cap applies to everyone, including exempt users.
  IF p_payout_amount > 100 THEN
    RAISE EXCEPTION 'Maximum amount to withdraw is 100 USDT';
  END IF;

  SELECT * INTO settings_row FROM admin_settings WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal settings are not configured';
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1
    FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    -- Boundaries are calculated in UTC, so limits reset automatically at 00:00 UTC.
    utc_day_start := date_trunc('day', timezone('UTC', now()));
    utc_year_start := date_trunc('year', timezone('UTC', now()));

    SELECT COALESCE(SUM(amount), 0) INTO daily_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_day_start;

    IF daily_total + p_payout_amount > settings_row.daily_withdrawal_limit THEN
      RAISE EXCEPTION 'Daily withdrawal limit of % USDT reached', settings_row.daily_withdrawal_limit;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO annual_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_year_start;

    IF annual_total + p_payout_amount > settings_row.max_withdrawal_amount THEN
      RAISE EXCEPTION 'Annual withdrawal limit of % USDT reached', settings_row.max_withdrawal_amount;
    END IF;
  END IF;

  IF COALESCE(user_row.balance, 0) < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  INSERT INTO notification (
    address,
    username,
    amount,
    sent,
    type,
    method,
    bank,
    accountname
  )
  VALUES (
    p_wallet,
    user_row.username,
    round(p_payout_amount::NUMERIC, 3),
    'pending',
    'withdraw',
    p_method,
    p_bank,
    p_accountname
  )
  RETURNING id INTO inserted_id;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_amount
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  RETURN jsonb_build_object(
    'status', 'success',
    'notificationId', inserted_id,
    'balance', next_balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_bet_atomic(TEXT, TEXT, TEXT, NUMERIC, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_reverse_match_atomic(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.place_bet_atomic(TEXT, TEXT, TEXT, NUMERIC, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_reverse_match_atomic(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO service_role;

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
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_impersonation_audit ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_impersonation_audit ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can manage own push tokens" ON push_tokens;
CREATE POLICY "Users can manage own push tokens" ON push_tokens
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can read own app notifications" ON app_notifications;
CREATE POLICY "Users can read own app notifications" ON app_notifications
  FOR SELECT
  TO authenticated
  USING (
    recipient_username IN (
      SELECT username FROM users WHERE userid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can update own app notifications" ON app_notifications;
CREATE POLICY "Users can update own app notifications" ON app_notifications
  FOR UPDATE
  TO authenticated
  USING (
    recipient_username IN (
      SELECT username FROM users WHERE userid = (select auth.uid())::text
    )
  )
  WITH CHECK (
    recipient_username IN (
      SELECT username FROM users WHERE userid = (select auth.uid())::text
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

GRANT ALL ON TABLE public.push_tokens TO service_role;
GRANT ALL ON TABLE public.app_notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.push_tokens TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.app_notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.push_tokens_id_seq TO service_role, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.app_notifications_id_seq TO service_role, authenticated;

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
