-- Convert the existing USDT ledger to MMK at the agreed fixed rate:
-- 1 USDT = 5,000 MMK. Payment-method rates remain units per 1 USDT.
-- Deposit notification.amount is the actual submitted payment amount and is
-- intentionally left in its payment currency. Withdrawal notification.amount
-- is ledger-denominated and is converted.

CREATE SCHEMA IF NOT EXISTS currency_backup;
REVOKE ALL ON SCHEMA currency_backup FROM PUBLIC, anon, authenticated;

CREATE TABLE currency_backup.users_before_mmk AS
SELECT id, balance, totald, totalw, dailywl, betspend, betwon FROM public.users;
CREATE TABLE currency_backup.placed_before_mmk AS
SELECT id, stake, aim, profit, aone, atwo, athree FROM public.placed;
CREATE TABLE currency_backup.notification_withdrawals_before_mmk AS
SELECT id, amount FROM public.notification
WHERE lower(coalesce(type, '')) IN ('withdraw', 'withdrawer');
CREATE TABLE currency_backup.admin_settings_before_mmk AS
SELECT id, min_withdrawal_amount, max_withdrawal_amount,
       daily_withdrawal_limit, membership_balance_threshold
FROM public.admin_settings;
CREATE TABLE currency_backup.reading_before_mmk AS
SELECT id, deposit, withdraw, bet, won FROM public.reading;
CREATE TABLE currency_backup.useractivity_before_mmk AS
SELECT id, amount, stake, profit FROM public.useractivity;
CREATE TABLE currency_backup.activa_before_mmk AS
SELECT id, amount FROM public.activa;
CREATE TABLE currency_backup.vip_daily_rewards_before_mmk AS
SELECT id, balance_before, amount, balance_after FROM public.vip_daily_rewards;

UPDATE public.users SET
  balance = balance * 5000,
  totald = totald * 5000,
  totalw = totalw * 5000,
  dailywl = dailywl * 5000,
  betspend = betspend * 5000,
  betwon = betwon * 5000;

UPDATE public.placed SET
  stake = stake * 5000,
  aim = aim * 5000,
  profit = profit * 5000,
  aone = aone * 5000,
  atwo = atwo * 5000,
  athree = athree * 5000;

UPDATE public.notification SET amount = amount * 5000
WHERE lower(coalesce(type, '')) IN ('withdraw', 'withdrawer');

UPDATE public.admin_settings SET
  min_withdrawal_amount = min_withdrawal_amount * 5000,
  max_withdrawal_amount = max_withdrawal_amount * 5000,
  daily_withdrawal_limit = daily_withdrawal_limit * 5000,
  membership_balance_threshold = membership_balance_threshold * 5000;

UPDATE public.reading SET
  deposit = deposit * 5000,
  withdraw = withdraw * 5000,
  bet = bet * 5000,
  won = won * 5000;

UPDATE public.useractivity SET
  amount = amount * 5000,
  stake = stake * 5000,
  profit = profit * 5000;

UPDATE public.activa SET amount = amount * 5000;

UPDATE public.vip_daily_rewards SET
  balance_before = balance_before * 5000,
  amount = amount * 5000,
  balance_after = balance_after * 5000;

-- Preserve each function's existing signature, security mode, and logic while
-- updating its currency-specific limits and messages.
DO $mmk$
DECLARE
  definition text;
  signature text;
BEGIN
  SELECT pg_get_functiondef('public.place_bet_atomic(text,text,text,numeric,uuid)'::regprocedure)
  INTO definition;
  IF position('p_stake < 1' IN definition) = 0 THEN
    RAISE EXCEPTION 'Unexpected place_bet_atomic definition';
  END IF;
  EXECUTE replace(replace(definition, 'p_stake < 1', 'p_stake < 5000'), 'USDT', 'MMK');

  FOREACH signature IN ARRAY ARRAY[
    'public.create_withdrawal_request_atomic(text,numeric,numeric,text,text,text,text)',
    'public.create_withdrawal_request_with_rate_snapshot_atomic(text,numeric,numeric,text,text,text,text,text,numeric)'
  ] LOOP
    SELECT pg_get_functiondef(signature::regprocedure) INTO definition;
    IF position('p_payout_amount > 100' IN definition) = 0 THEN
      RAISE EXCEPTION 'Unexpected withdrawal function definition: %', signature;
    END IF;
    EXECUTE replace(replace(definition, 'p_payout_amount > 100', 'p_payout_amount > 500000'), 'USDT', 'MMK');
  END LOOP;

  SELECT pg_get_functiondef('public.active_member_balance_threshold()'::regprocedure)
  INTO definition;
  IF position('1.667' IN definition) = 0 THEN
    RAISE EXCEPTION 'Unexpected active member threshold definition';
  END IF;
  EXECUTE replace(definition, '1.667', '8335');
END;
$mmk$;

CREATE OR REPLACE FUNCTION public.vip_level_for_user(total_deposit numeric, referral_count integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE
    WHEN COALESCE(total_deposit, 0) >= 2500000 AND COALESCE(referral_count, 0) >= 20 THEN 7
    WHEN COALESCE(total_deposit, 0) >= 1500000 AND COALESCE(referral_count, 0) >= 15 THEN 6
    WHEN COALESCE(total_deposit, 0) >= 1000000 AND COALESCE(referral_count, 0) >= 12 THEN 5
    WHEN COALESCE(total_deposit, 0) >= 500000 AND COALESCE(referral_count, 0) >= 8 THEN 4
    WHEN COALESCE(total_deposit, 0) >= 250000 AND COALESCE(referral_count, 0) >= 5 THEN 3
    WHEN COALESCE(total_deposit, 0) >= 100000 AND COALESCE(referral_count, 0) >= 3 THEN 2
    ELSE 1
  END;
$function$;
