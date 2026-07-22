-- One-time, idempotent conversion of the platform ledger from USDT to FCFA.
-- Conversion rate selected for the migration: 1 USDT = 600 FCFA.
BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_migrations (
  migration_key TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_migrations
    WHERE migration_key = '2026-07-fcfa-ledger-v1'
  ) THEN
    UPDATE public.users SET
      balance = COALESCE(balance, 0) * 600,
      totald = COALESCE(totald, 0) * 600,
      dailywl = COALESCE(dailywl, 0) * 600,
      betspend = COALESCE(betspend, 0) * 600,
      betwon = COALESCE(betwon, 0) * 600,
      deposit = COALESCE(deposit, 0) * 600,
      totalw = COALESCE(totalw, 0) * 600;

    UPDATE public.placed SET
      stake = stake * 600,
      aim = aim * 600,
      profit = COALESCE(profit, 0) * 600,
      aone = COALESCE(aone, 0) * 600,
      atwo = COALESCE(atwo, 0) * 600,
      athree = COALESCE(athree, 0) * 600;

    -- Deposit rows store the submitted payment-method amount and must not be rescaled.
    -- Withdrawal rows store the ledger payout amount and therefore convert to FCFA.
    UPDATE public.notification
    SET amount = amount * 600
    WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer');
    UPDATE public.activa SET amount = COALESCE(amount, 0) * 600;
    UPDATE public.vip_daily_rewards SET
      balance_before = balance_before * 600,
      amount = amount * 600,
      balance_after = balance_after * 600;
    UPDATE public.useractivity SET
      amount = COALESCE(amount, 0) * 600,
      stake = COALESCE(stake, 0) * 600,
      profit = COALESCE(profit, 0) * 600;
    UPDATE public.reading SET
      bets = COALESCE(bets, 0) * 600,
      deposit = COALESCE(deposit, 0) * 600,
      withdraw = COALESCE(withdraw, 0) * 600,
      bet = COALESCE(bet, 0) * 600,
      won = COALESCE(won, 0) * 600;

    UPDATE public.admin_settings SET
      min_withdrawal_amount = COALESCE(min_withdrawal_amount, 10) * 600,
      max_withdrawal_amount = COALESCE(max_withdrawal_amount, 100000) * 600,
      daily_withdrawal_limit = COALESCE(daily_withdrawal_limit, 100) * 600;

    -- Payment rates become payment-currency units per 1 FCFA instead of per 1 USDT.
    UPDATE public.walle SET rates = rates / 600 WHERE rates IS NOT NULL AND rates > 0;
    UPDATE public.walle SET rates = 1
      WHERE lower(COALESCE(currency_code, name, '')) IN ('xof', 'fcfa', 'cfa');

    INSERT INTO public.platform_migrations (migration_key)
    VALUES ('2026-07-fcfa-ledger-v1');
  END IF;
END $$;

ALTER TABLE public.admin_settings DROP COLUMN IF EXISTS xof_per_usdt;

CREATE OR REPLACE FUNCTION public.vip_level_for_user(total_deposit NUMERIC, referral_count INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN COALESCE(total_deposit, 0) >= 300000 AND COALESCE(referral_count, 0) >= 20 THEN 7
    WHEN COALESCE(total_deposit, 0) >= 180000 AND COALESCE(referral_count, 0) >= 15 THEN 6
    WHEN COALESCE(total_deposit, 0) >= 120000 AND COALESCE(referral_count, 0) >= 12 THEN 5
    WHEN COALESCE(total_deposit, 0) >= 60000 AND COALESCE(referral_count, 0) >= 8 THEN 4
    WHEN COALESCE(total_deposit, 0) >= 30000 AND COALESCE(referral_count, 0) >= 5 THEN 3
    WHEN COALESCE(total_deposit, 0) >= 12000 AND COALESCE(referral_count, 0) >= 3 THEN 2
    ELSE 1
  END;
$$;

-- Preserve the current atomic implementations while changing their currency thresholds/messages.
DO $$
DECLARE function_sql TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO function_sql
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'place_bet_atomic'
  ORDER BY p.oid DESC LIMIT 1;

  IF function_sql IS NOT NULL THEN
    function_sql := replace(function_sql, 'p_stake < 1', 'p_stake < 600');
    function_sql := replace(function_sql, 'Enough USDT', 'Enough FCFA');
    EXECUTE function_sql;
  END IF;

  SELECT pg_get_functiondef(p.oid) INTO function_sql
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'create_withdrawal_request_atomic'
  ORDER BY p.oid DESC LIMIT 1;

  IF function_sql IS NOT NULL THEN
    function_sql := replace(function_sql, 'p_payout_amount > 100', 'p_payout_amount > 60000');
    function_sql := replace(function_sql, '100 USDT', '60,000 FCFA');
    function_sql := replace(function_sql, '% USDT reached', '% FCFA reached');
    EXECUTE function_sql;
  END IF;
END $$;

COMMIT;
