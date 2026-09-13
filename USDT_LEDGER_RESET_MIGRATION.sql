-- Run this once AFTER wiping user/auth/transaction data and BEFORE reopening the platform.
-- It preserves payment-method records and other configuration, but changes the ledger
-- and retained monetary configuration from FCFA semantics back to USDT semantics.

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_migrations (
  migration_key TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings
  ALTER COLUMN membership_balance_threshold SET DEFAULT 1.667,
  ALTER COLUMN min_withdrawal_amount SET DEFAULT 10.000,
  ALTER COLUMN max_withdrawal_amount SET DEFAULT 100000.000,
  ALTER COLUMN daily_withdrawal_limit SET DEFAULT 100.000;

UPDATE public.admin_settings
SET membership_balance_threshold = 1.667,
    min_withdrawal_amount = 10.000,
    max_withdrawal_amount = 100000.000,
    daily_withdrawal_limit = 100.000,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- A payment rate used to mean payment-currency units per 1 FCFA. It now means
-- payment-currency units per 1 USDT. With 600 FCFA = 1 USDT, multiply retained
-- payment rates by 600. Native USDT methods must remain exactly 1:1.
DO $$
DECLARE
  has_rates BOOLEAN;
  has_currency_code BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'walle' AND column_name = 'rates'
  ) INTO has_rates;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'walle' AND column_name = 'currency_code'
  ) INTO has_currency_code;

  IF has_rates THEN
    EXECUTE 'UPDATE public.walle SET rates = rates * 600 WHERE rates IS NOT NULL AND rates > 0';
    IF has_currency_code THEN
      EXECUTE $sql$UPDATE public.walle
        SET rates = 1
        WHERE lower(COALESCE(currency_code, name, '')) IN ('usdt', 'usd', 'tether')$sql$;
    END IF;
  END IF;
END $$;

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

-- Keep the deployed atomic implementations authoritative while replacing only
-- their legacy FCFA thresholds/messages. This supports both withdrawal RPC names.
DO $$
DECLARE
  function_name TEXT;
  function_sql TEXT;
BEGIN
  FOREACH function_name IN ARRAY ARRAY[
    'place_bet_atomic',
    'create_withdrawal_request_atomic',
    'create_withdrawal_request_with_rate_snapshot_atomic'
  ] LOOP
    SELECT pg_get_functiondef(p.oid) INTO function_sql
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = function_name
    ORDER BY p.oid DESC
    LIMIT 1;

    IF function_sql IS NULL THEN
      CONTINUE;
    END IF;

    function_sql := replace(function_sql, 'p_stake < 600', 'p_stake < 1');
    function_sql := replace(function_sql, 'enough FCFA', 'enough USDT');
    function_sql := replace(function_sql, 'p_payout_amount > 60000', 'p_payout_amount > 100');
    function_sql := replace(function_sql, '60,000 FCFA', '100 USDT');
    function_sql := replace(function_sql, '% FCFA reached', '% USDT reached');
    EXECUTE function_sql;
  END LOOP;
END $$;

INSERT INTO public.platform_migrations (migration_key)
VALUES ('2026-09-usdt-ledger-reset-v1')
ON CONFLICT (migration_key) DO NOTHING;

COMMIT;
