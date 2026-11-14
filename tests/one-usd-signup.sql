-- Run after 20261114150000_one_usd_signup_and_minimum_bet.sql as administrator.
-- No persistent fixture accounts or credits are created.
BEGIN;
DO $$
DECLARE fn record; definition text; checked integer := 0;
BEGIN
  FOR fn IN
    SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('place_bet_atomic','native_bet_quote','place_native_bet_atomic')
  LOOP
    definition := pg_get_functiondef(fn.oid);
    IF definition ~ 'p_stake\s*<\s*2500\M'
      OR definition !~ 'p_stake\s*<\s*5000\M' THEN
      RAISE EXCEPTION 'Betting function % does not enforce the one USD minimum',fn.oid::regprocedure;
    END IF;
    checked := checked + 1;
  END LOOP;
  IF checked < 3 THEN RAISE EXCEPTION 'Expected all three quote/placement functions'; END IF;
  IF has_function_privilege('anon','public.provision_native_profile_atomic(text,text,text,text,text,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.provision_native_profile_atomic(text,text,text,text,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Signup provisioning must remain server-only';
  END IF;
END;
$$;
SET LOCAL ROLE service_role;
DO $$
DECLARE fixture record; identity text; username text; result jsonb; balance numeric; currency text;
BEGIN
  FOR fixture IN SELECT * FROM (VALUES
    ('US','+1','USDT',1),('MM','+95','MMK',5000),
    ('CI','+225','FCFA',600),('ZM','+260','ZMW',20)
  ) AS cases(country,dial,code,units) LOOP
    identity := gen_random_uuid()::text;
    username := 'signup_test_' || replace(identity,'-','');
    result := public.provision_country_profile_atomic(identity,username||'@example.invalid',username,'9123456789',fixture.dial,NULL,fixture.country);
    SELECT u.balance,u.currency_code INTO balance,currency FROM public.users u WHERE userid=identity;
    IF NOT (result->>'created')::boolean OR balance IS DISTINCT FROM 5000 OR currency IS DISTINCT FROM fixture.code THEN
      RAISE EXCEPTION 'Incorrect signup credit for %',fixture.code;
    END IF;
    IF balance/5000*fixture.units <> fixture.units THEN RAISE EXCEPTION 'Incorrect converted credit'; END IF;
    -- Simulate spending: recovery must neither reset nor add to the balance.
    UPDATE public.users SET balance=1234 WHERE userid=identity;
    result := public.provision_country_profile_atomic(identity,username||'@example.invalid',username,'9123456789',fixture.dial,NULL,fixture.country);
    IF (result->>'created')::boolean OR (SELECT u.balance FROM public.users u WHERE userid=identity) <> 1234 THEN
      RAISE EXCEPTION 'Retry changed the balance';
    END IF;
  END LOOP;
END;
$$;
ROLLBACK;
