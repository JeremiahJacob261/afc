-- CURRENT AFC/UCL DATABASE MIGRATIONS — COMBINED
-- Generated from the repository migration files in dependency order.
-- Paste this entire file into the Supabase SQL Editor and run it once.
--
-- Deliberately excluded:
--   * FCFA_LEDGER_MIGRATION.sql: retired currency conversion.
--   * USDT_LEDGER_RESET_MIGRATION.sql: only valid after wiping user/auth/transaction data.
--   * ACTIVE_MEMBER_BALANCE_MIGRATION.sql: superseded by the current 1.667 USDT threshold.
--   * PAYMENT_CLEANUP_QUERIES.sql: diagnostic queries, not a migration.
--   * supabase_schema.sql: full fresh-install schema, not an incremental migration.

-- ============================================================================
-- 01. PAYMENT_ATOMIC_RPC_PATCH.sql
-- ============================================================================
-- Apply this patch to the Supabase database before deploying the API changes.
-- It adds atomic payment RPCs and the small metadata columns they need.

ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit DECIMAL(15, 4) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totalw DECIMAL(15, 4) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  first_deposit_bonus_percent DECIMAL(6, 3) NOT NULL DEFAULT 3.000,
  membership_balance_threshold DECIMAL(15, 3) NOT NULL DEFAULT 1000.000 CHECK (membership_balance_threshold >= 0),
  min_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 10.000,
  max_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 100000.000,
  withdrawal_fee_percent DECIMAL(6, 3) NOT NULL DEFAULT 7.000,
  withdrawals_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  withdrawal_disabled_message TEXT NOT NULL DEFAULT 'Withdrawals are temporarily unavailable. Please try again later.',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS membership_balance_threshold DECIMAL(15, 3) NOT NULL DEFAULT 1000.000 CHECK (membership_balance_threshold >= 0);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(15, 3) NOT NULL DEFAULT 100.000 CHECK (daily_withdrawal_limit >= 0);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawal_limit_exempt_usernames TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawals_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawal_disabled_message TEXT NOT NULL DEFAULT 'Withdrawals are temporarily unavailable. Please try again later.';
INSERT INTO admin_settings (id, daily_withdrawal_limit, withdrawal_limit_exempt_usernames)
VALUES (1, 100.000, '{}') ON CONFLICT (id) DO NOTHING;

ALTER TABLE notification ADD COLUMN IF NOT EXISTS uid TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processed_action TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

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

CREATE INDEX IF NOT EXISTS idx_notification_uid ON notification(uid);
CREATE INDEX IF NOT EXISTS idx_notification_processed_at ON notification(processed_at);
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_limit ON notification(username, created_at) WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer');
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_pending
  ON notification(username, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_success
  ON notification(username, processed_at, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed');

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
    SELECT * INTO notification_row FROM notification WHERE id = p_id FOR UPDATE;
  ELSE
    SELECT * INTO notification_row FROM notification WHERE uid::TEXT = p_uid FOR UPDATE;
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
      RETURN jsonb_build_object('status', 'success', 'sent', 'success', 'alreadyProcessed', TRUE, 'transactionId', notification_row.id);
    END IF;
    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent IN ('failed', 'false') THEN
    IF p_action = 'reject' THEN
      RETURN jsonb_build_object('status', 'success', 'sent', 'failed', 'alreadyProcessed', TRUE, 'transactionId', notification_row.id);
    END IF;
    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent = 'processing' THEN
    RAISE EXCEPTION 'Transaction already being processed';
  END IF;

  IF normalized_type NOT IN ('deposit', 'withdraw', 'withdrawer') THEN
    RAISE EXCEPTION 'Unsupported transaction type';
  END IF;

  SELECT * INTO user_row FROM users WHERE username = notification_row.username FOR UPDATE;
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

  RETURN jsonb_build_object('status', 'success', 'sent', final_sent, 'alreadyProcessed', FALSE, 'transactionId', notification_row.id);
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

  SELECT * INTO user_row FROM users WHERE userid = p_userid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- The immutable 100 USDT cap applies to everyone, including exempt users.
  IF p_payout_amount > 100 THEN
    RAISE EXCEPTION 'Maximum amount to withdraw is 100 USDT';
  END IF;

  SELECT * INTO settings_row FROM admin_settings WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal settings are not configured';
  END IF;

  IF NOT COALESCE(settings_row.withdrawals_enabled, TRUE) THEN
    RAISE EXCEPTION '%', COALESCE(NULLIF(btrim(settings_row.withdrawal_disabled_message), ''), 'Withdrawals are temporarily unavailable. Please try again later.');
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1
    FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing')
    ) THEN
      RAISE EXCEPTION 'A pending withdrawal request already exists';
    END IF;

    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed')
        AND COALESCE(processed_at, created_at) >= (timezone('UTC', now()) - INTERVAL '24 hours')
    ) THEN
      RAISE EXCEPTION 'A successful withdrawal was completed within the last 24 hours';
    END IF;

    utc_day_start := date_trunc('day', timezone('UTC', now()));
    -- Boundaries are calculated in UTC, so limits reset automatically at 00:00 UTC.
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

  INSERT INTO notification (address, username, amount, sent, type, method, bank, accountname)
  VALUES (p_wallet, user_row.username, round(p_payout_amount::NUMERIC, 3), 'pending', 'withdraw', p_method, p_bank, p_accountname)
  RETURNING id INTO inserted_id;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_amount
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  RETURN jsonb_build_object('status', 'success', 'notificationId', inserted_id, 'balance', next_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ============================================================================
-- 02. PAYMENT_RATE_SNAPSHOT_MIGRATION.sql
-- ============================================================================
-- Run before deploying the payment-rate snapshot API changes.
-- Pending transactions keep the rate selected at request time, rather than
-- depending on a payment method that may latera be edited or deleted.

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS method_currency TEXT,
  ADD COLUMN IF NOT EXISTS method_rate DECIMAL(20, 8);
ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- USDT aliases have a stable 1:1 rate and can be safely backfilled. Other
-- legacy rows intentionally remain NULL so they require an explicit review.
UPDATE public.notification
SET method_currency = 'USDT',
    method_rate = 1
WHERE method_rate IS NULL
  AND lower(regexp_replace(COALESCE(method, ''), '[()_-]+', ' ', 'g'))
    ~ '(^| )(usdt|usd|tether)( |$)';

CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_pending
  ON public.notification (username, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_success
  ON public.notification (username, processed_at, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed');

CREATE OR REPLACE FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(
  p_userid TEXT,
  p_amount NUMERIC,
  p_payout_amount NUMERIC,
  p_wallet TEXT,
  p_method TEXT,
  p_bank TEXT,
  p_accountname TEXT,
  p_method_currency TEXT,
  p_method_rate NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  user_row users%ROWTYPE;
  settings_row admin_settings%ROWTYPE;
  inserted_id BIGINT;
  next_balance NUMERIC;
  daily_total NUMERIC;
  annual_total NUMERIC;
  is_limit_exempt BOOLEAN;
  utc_day_start TIMESTAMP;
  utc_year_start TIMESTAMP;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_payout_amount IS NULL OR p_payout_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF p_method_currency IS NULL OR btrim(p_method_currency) = '' OR p_method_rate IS NULL OR p_method_rate <= 0 THEN RAISE EXCEPTION 'Invalid payment method rate'; END IF;

  SELECT * INTO user_row FROM users WHERE userid = p_userid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF p_payout_amount > 100 THEN RAISE EXCEPTION 'Maximum amount to withdraw is 100 USDT'; END IF;

  SELECT * INTO settings_row FROM admin_settings WHERE id = 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal settings are not configured'; END IF;
  IF NOT COALESCE(settings_row.withdrawals_enabled, TRUE) THEN
    RAISE EXCEPTION '%', COALESCE(NULLIF(btrim(settings_row.withdrawal_disabled_message), ''), 'Withdrawals are temporarily unavailable. Please try again later.');
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1 FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing')
    ) THEN
      RAISE EXCEPTION 'A pending withdrawal request already exists';
    END IF;

    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed')
        AND COALESCE(processed_at, created_at) >= (timezone('UTC', now()) - INTERVAL '24 hours')
    ) THEN
      RAISE EXCEPTION 'A successful withdrawal was completed within the last 24 hours';
    END IF;

    utc_day_start := date_trunc('day', timezone('UTC', now()));
    utc_year_start := date_trunc('year', timezone('UTC', now()));
    SELECT COALESCE(SUM(amount), 0) INTO daily_total FROM notification
    WHERE username = user_row.username AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected') AND created_at >= utc_day_start;
    IF daily_total + p_payout_amount > settings_row.daily_withdrawal_limit THEN
      RAISE EXCEPTION 'Daily withdrawal limit of % USDT reached', settings_row.daily_withdrawal_limit;
    END IF;
    SELECT COALESCE(SUM(amount), 0) INTO annual_total FROM notification
    WHERE username = user_row.username AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected') AND created_at >= utc_year_start;
    IF annual_total + p_payout_amount > settings_row.max_withdrawal_amount THEN
      RAISE EXCEPTION 'Annual withdrawal limit of % USDT reached', settings_row.max_withdrawal_amount;
    END IF;
  END IF;

  IF COALESCE(user_row.balance, 0) < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  INSERT INTO notification (address, username, amount, sent, type, method, method_currency, method_rate, bank, accountname)
  VALUES (p_wallet, user_row.username, round(p_payout_amount::NUMERIC, 3), 'pending', 'withdraw', p_method, p_method_currency, p_method_rate, p_bank, p_accountname)
  RETURNING id INTO inserted_id;

  UPDATE users SET balance = COALESCE(balance, 0) - p_amount WHERE username = user_row.username RETURNING balance INTO next_balance;
  RETURN jsonb_build_object('status', 'success', 'notificationId', inserted_id, 'balance', next_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO service_role;

-- ============================================================================
-- 03. WITHDRAWAL_LIMITS_MIGRATION.sql
-- ============================================================================
-- Run this entire file once in the Supabase SQL Editor.
-- It preserves existing settings and withdrawal records.

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  first_deposit_bonus_percent DECIMAL(6, 3) NOT NULL DEFAULT 3.000,
  min_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 10.000,
  max_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 100000.000,
  withdrawal_fee_percent DECIMAL(6, 3) NOT NULL DEFAULT 7.000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(15, 3) NOT NULL DEFAULT 100.000 CHECK (daily_withdrawal_limit >= 0),
  ADD COLUMN IF NOT EXISTS withdrawal_limit_exempt_usernames TEXT[] NOT NULL DEFAULT '{}';

-- Do not overwrite any existing admin configuration.
INSERT INTO public.admin_settings (id, daily_withdrawal_limit, withdrawal_limit_exempt_usernames)
VALUES (1, 100.000, '{}')
ON CONFLICT (id) DO NOTHING;

-- Needed to calculate limits for older installations that do not yet have it.
ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_limit
  ON public.notification (username, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer');
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_pending
  ON public.notification (username, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_success
  ON public.notification (username, processed_at, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed');

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

  -- Locking the user row makes concurrent requests from the same user safe.
  SELECT * INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- This per-request cap applies to everyone, including exempt usernames.
  IF p_payout_amount > 100 THEN
    RAISE EXCEPTION 'Maximum amount to withdraw is 100 USDT';
  END IF;

  SELECT * INTO settings_row
  FROM admin_settings
  WHERE id = 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal settings are not configured';
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1
    FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing')
    ) THEN
      RAISE EXCEPTION 'A pending withdrawal request already exists';
    END IF;

    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed')
        AND COALESCE(processed_at, created_at) >= (timezone('UTC', now()) - INTERVAL '24 hours')
    ) THEN
      RAISE EXCEPTION 'A successful withdrawal was completed within the last 24 hours';
    END IF;

    utc_day_start := date_trunc('day', timezone('UTC', now()));
    -- UTC boundaries make the daily allowance reset automatically at 00:00 UTC.
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

  INSERT INTO notification (address, username, amount, sent, type, method, bank, accountname)
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

REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ============================================================================
-- 04. WITHDRAWAL_FREQUENCY_MIGRATION.sql
-- ============================================================================
-- Run this migration once in the Supabase SQL editor.
-- It blocks pending withdrawals and successful withdrawals within 24 hours.

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

ALTER TABLE public.notification
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_limit
  ON public.notification (username, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer');
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_pending
  ON public.notification (username, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_success
  ON public.notification (username, processed_at, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
    AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed');

CREATE OR REPLACE FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(
  p_userid TEXT,
  p_amount NUMERIC,
  p_payout_amount NUMERIC,
  p_wallet TEXT,
  p_method TEXT,
  p_bank TEXT,
  p_accountname TEXT,
  p_method_currency TEXT,
  p_method_rate NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  user_row users%ROWTYPE;
  settings_row admin_settings%ROWTYPE;
  inserted_id BIGINT;
  next_balance NUMERIC;
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

  IF p_method_currency IS NULL OR btrim(p_method_currency) = '' OR p_method_rate IS NULL OR p_method_rate <= 0 THEN
    RAISE EXCEPTION 'Invalid payment method rate';
  END IF;

  SELECT * INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF p_payout_amount > 100 THEN
    RAISE EXCEPTION 'Maximum amount to withdraw is 100 USDT';
  END IF;

  SELECT * INTO settings_row FROM admin_settings WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal settings are not configured';
  END IF;

  IF NOT COALESCE(settings_row.withdrawals_enabled, TRUE) THEN
    RAISE EXCEPTION '%', COALESCE(NULLIF(btrim(settings_row.withdrawal_disabled_message), ''), 'Withdrawals are temporarily unavailable. Please try again later.');
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1
    FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing')
    ) THEN
      RAISE EXCEPTION 'A pending withdrawal request already exists';
    END IF;

    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed')
        AND COALESCE(processed_at, created_at) >= (timezone('UTC', now()) - INTERVAL '24 hours')
    ) THEN
      RAISE EXCEPTION 'A successful withdrawal was completed within the last 24 hours';
    END IF;

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
    method_currency,
    method_rate,
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
    p_method_currency,
    p_method_rate,
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

  SELECT * INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

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
    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing')
    ) THEN
      RAISE EXCEPTION 'A pending withdrawal request already exists';
    END IF;

    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed')
        AND COALESCE(processed_at, created_at) >= (timezone('UTC', now()) - INTERVAL '24 hours')
    ) THEN
      RAISE EXCEPTION 'A successful withdrawal was completed within the last 24 hours';
    END IF;

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

  INSERT INTO notification (address, username, amount, sent, type, method, bank, accountname)
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

REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO service_role;

REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Legacy balance-deduction functions were previously callable by regular
-- Supabase clients and could bypass withdrawal-request limits.
DO $$
BEGIN
  IF to_regprocedure('public.withdraw(numeric,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.withdraw(numeric, text) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.withdraw(numeric, text) TO service_role';
  END IF;

  IF to_regprocedure('public.withdrawer(text,numeric)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.withdrawer(text, numeric) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.withdrawer(text, numeric) TO service_role';
  END IF;
END;
$$;

-- ============================================================================
-- 05. WITHDRAWAL_AVAILABILITY_MIGRATION.sql
-- ============================================================================
-- Run this in Supabase before deploying the withdrawal availability controls.
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS withdrawals_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS withdrawal_disabled_message TEXT NOT NULL DEFAULT 'Withdrawals are temporarily unavailable. Please try again later.';

INSERT INTO public.admin_settings (id, withdrawals_enabled, withdrawal_disabled_message)
VALUES (1, TRUE, 'Withdrawals are temporarily unavailable. Please try again later.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 06. VIP_DAILY_REWARDS.sql
-- ============================================================================
-- VIP daily balance rewards
-- Apply once to an existing Supabase database.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE INDEX IF NOT EXISTS idx_users_refer_firstd
  ON public.users(refer, firstd);

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS membership_balance_threshold DECIMAL(15, 3) NOT NULL DEFAULT 1.667
  CHECK (membership_balance_threshold >= 0);

ALTER TABLE public.admin_settings
  ALTER COLUMN membership_balance_threshold SET DEFAULT 1.667;

-- Replace the legacy default introduced by older USDT migrations while
-- preserving any administrator-selected custom threshold.
UPDATE public.admin_settings
SET membership_balance_threshold = 1.667,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1
  AND membership_balance_threshold = 1000.000;

CREATE INDEX IF NOT EXISTS idx_users_refer_balance
  ON public.users(refer, balance);

CREATE OR REPLACE FUNCTION public.active_member_balance_threshold()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT membership_balance_threshold FROM public.admin_settings WHERE id = 1),
    1.667
  )::NUMERIC;
$$;

CREATE OR REPLACE FUNCTION public.is_active_member(p_balance NUMERIC)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p_balance, 0)::NUMERIC >= public.active_member_balance_threshold();
$$;

CREATE TABLE IF NOT EXISTS public.vip_daily_rewards (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES public.users(username),
  reward_date DATE NOT NULL,
  vip_level INTEGER NOT NULL,
  daily_rate DECIMAL(8, 6) NOT NULL,
  balance_before DECIMAL(15, 4) NOT NULL,
  amount DECIMAL(15, 4) NOT NULL,
  balance_after DECIMAL(15, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, reward_date)
);

CREATE INDEX IF NOT EXISTS idx_vip_daily_rewards_date
  ON public.vip_daily_rewards(reward_date);

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
        FROM public.users downline
        WHERE downline.refer = u.newrefer
          AND public.is_active_member(downline.balance)
      ) AS active_downlines
    FROM public.users u
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
    INSERT INTO public.vip_daily_rewards (
      username, reward_date, vip_level, daily_rate,
      balance_before, amount, balance_after
    )
    VALUES (
      user_row.username, p_reward_date, vip_level, daily_rate,
      user_row.current_balance, reward_amount,
      user_row.current_balance + reward_amount
    )
    ON CONFLICT (username, reward_date) DO NOTHING
    RETURNING id INTO reward_id;

    IF reward_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.users
    SET balance = COALESCE(balance, 0) + reward_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_row.id
    RETURNING balance INTO next_balance;

    UPDATE public.vip_daily_rewards
    SET balance_after = next_balance
    WHERE id = reward_id;

    INSERT INTO public.activa (code, username, amount, type)
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'apply-vip-daily-rewards-utc'
  ) THEN
    PERFORM cron.unschedule('apply-vip-daily-rewards-utc');
  END IF;
END $$;

SELECT cron.schedule(
  'apply-vip-daily-rewards-utc',
  '0 0 * * *',
  $$SELECT public.apply_vip_daily_rewards();$$
);

-- ============================================================================
-- 07. COMMISSION_SNAPSHOT_MIGRATION.sql
-- ============================================================================
-- Run this entire file once in the Supabase SQL Editor.
--
-- Why: place_bet_atomic snapshots the level-one referral commission on the bet
-- as 0.05 * profit, but settle_reverse_match_atomic actually pays 0.06 * profit.
-- The stored aone column has understated every level-one payout since the
-- commission rate was raised. This corrects the rate for new bets and repairs
-- the existing snapshot.
--
-- aone = 0.06 * profit, atwo = 0.03 * profit, athree = 0.01 * profit.
-- Only aone is wrong; atwo and athree already match what is paid.

-- Repair the snapshot on existing settled and unsettled bets.
-- aone is 0 when the bettor had no referrer, so only non-zero rows are touched.
UPDATE public.placed
SET aone = round(COALESCE(profit, 0) * 0.06, 4)
WHERE COALESCE(aone, 0) > 0;

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
    RAISE EXCEPTION 'You do not have enough USDT to complete this bet';
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
    AND public.is_active_member(balance);

  vip_level := public.vip_level_for_user(user_row.totald, referral_count);
  final_odd := round(base_odd * (1 + public.vip_bonus_for_level(vip_level)), 3);
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
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.06 * profit_amount END,
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
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.06 * profit_amount END,
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

-- ============================================================================
-- 08. SETTLEMENT_OUTCOME_MIGRATION.sql
-- ============================================================================
-- Run this entire file once in the Supabase SQL Editor.
--
-- Why: settlement currently records a refunded company-market bet with the same
-- `won = 'true'` value as a real win, and pays no referral commission on it.
-- Any consumer reading `placed.won` alone cannot tell a win from a refund, so
-- the web UI reports both as "Won". This stores the actual outcome on the bet.
--
-- Outcomes: 'won'     -> stake + profit paid, referral commission paid
--           'refunded'-> stake returned, no profit, no referral commission
--           'lost'    -> stake forfeited
--           NULL      -> not settled yet

ALTER TABLE public.placed
  ADD COLUMN IF NOT EXISTS settlement_outcome TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'placed_settlement_outcome_check'
  ) THEN
    ALTER TABLE public.placed
      ADD CONSTRAINT placed_settlement_outcome_check
      CHECK (
        settlement_outcome IS NULL
        OR settlement_outcome IN ('won', 'refunded', 'lost')
      );
  END IF;
END;
$$;

-- Backfill in this order so no row is written twice.
-- Refunds first: they are the only case that also carries won = 'true'.

-- A refund is a bet that landed on the house's protected market of a company
-- match. placed.market holds the label ("1 - 0"); bets.comarket holds the key
-- ("onenil"), so both sides go through score_market_key to compare.
UPDATE public.placed p
SET settlement_outcome = 'refunded'
FROM public.bets b
WHERE p.match_id = b.match_id
  AND COALESCE(b.company, FALSE)
  AND b.comarket IS NOT NULL
  AND p.won = 'true'
  AND p.settlement_outcome IS NULL
  AND public.score_market_key(p.market) = public.score_market_key(b.comarket);

-- Any other successful bet is a genuine win.
UPDATE public.placed
SET settlement_outcome = 'won'
WHERE won = 'true'
  AND settlement_outcome IS NULL;

UPDATE public.placed
SET settlement_outcome = 'lost'
WHERE won = 'false'
  AND settlement_outcome IS NULL;

CREATE INDEX IF NOT EXISTS idx_placed_settlement_outcome
  ON public.placed (username, settlement_outcome);

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
      SET won = 'true',
          settlement_outcome = 'won'
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
      -- House rule: a company match refunds the protected market rather than
      -- paying it. Stake returns, no profit, no referral commission.
      UPDATE users
      SET balance = COALESCE(balance, 0) + COALESCE(bet_row.stake, 0)
      WHERE username = bet_row.username;

      UPDATE placed
      SET won = 'true',
          settlement_outcome = 'refunded'
      WHERE betid = bet_row.betid;

      refunded_count := refunded_count + 1;
    ELSE
      UPDATE placed
      SET won = 'false',
          settlement_outcome = 'lost'
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
-- 09. BET_ODD_INTEGRITY_MIGRATION.sql
-- ============================================================================
-- Lock each placed bet to the three-decimal odd the user confirmed.
-- The wrapper calls the existing atomic function in the same transaction.
-- Raising after a mismatch rolls back the inserted bet and balance deduction.

BEGIN;

CREATE OR REPLACE FUNCTION public.place_bet_with_expected_odd_atomic(
  p_userid TEXT,
  p_match_id TEXT,
  p_picked TEXT,
  p_stake NUMERIC,
  p_expected_odd NUMERIC,
  p_client_bet_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  accepted_odd NUMERIC;
BEGIN
  IF p_expected_odd IS NULL OR p_expected_odd <= 0 THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;

  result := public.place_bet_atomic(
    p_userid,
    p_match_id,
    p_picked,
    p_stake,
    p_client_bet_id
  );

  SELECT round(COALESCE(placed_row.odd, 0)::NUMERIC, 3)
  INTO accepted_odd
  FROM public.placed placed_row
  JOIN public.users bet_user ON bet_user.username = placed_row.username
  WHERE placed_row.betid::TEXT = result ->> 'betid'
    AND placed_row.match_id = p_match_id
    AND bet_user.userid = p_userid
  LIMIT 1;

  accepted_odd := COALESCE(
    accepted_odd,
    round(COALESCE(NULLIF(result ->> 'odd', '')::NUMERIC, 0), 3)
  );

  IF round(p_expected_odd, 3) <> accepted_odd THEN
    RAISE EXCEPTION 'Odds changed. New odd is %. Please review and place the bet again', accepted_odd;
  END IF;

  RETURN result || jsonb_build_object('odd', accepted_odd);
END;
$$;

REVOKE ALL ON FUNCTION public.place_bet_with_expected_odd_atomic(
  TEXT, TEXT, TEXT, NUMERIC, NUMERIC, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_bet_with_expected_odd_atomic(
  TEXT, TEXT, TEXT, NUMERIC, NUMERIC, UUID
) TO service_role;

COMMIT;

-- ============================================================================
-- 10. LANGUAGE_AVAILABILITY_MIGRATION.sql
-- ============================================================================
-- Keep push-token language values aligned with the active application locales.
BEGIN;

UPDATE public.push_tokens
SET language = 'en'
WHERE language IS NULL
   OR language NOT IN ('en', 'fr', 'es', 'it', 'ru');

ALTER TABLE public.push_tokens
  DROP CONSTRAINT IF EXISTS push_tokens_language_check;

ALTER TABLE public.push_tokens
  ADD CONSTRAINT push_tokens_language_check
  CHECK (language IN ('en', 'fr', 'es', 'it', 'ru'));

COMMIT;

-- ============================================================================
-- 11. PLATFORM_LINKS_MIGRATION.sql
-- ============================================================================
-- Editable community and support links shared by the website and mobile app.
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS telegram_group_url TEXT NOT NULL DEFAULT 'https://t.me/+Giav1o1JVGNkYzNk',
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/I1D6NNWndu6HDrbzB5BkPX?s=hd&p=i&mlu=0&ilr=0',
  ADD COLUMN IF NOT EXISTS customer_support_url TEXT NOT NULL DEFAULT 'https://t.me/EFC_Support';
