-- USD-equivalent policy: 1 USDT = 5,000 MMK = 600 FCFA = 20 ZMW.
-- The shared ledger is MMK; account-currency presentation converts these amounts.
BEGIN;

-- Set the signup credit explicitly rather than changing the default for every
-- users insert. Existing profiles and provisioning retries receive no new credit.
CREATE OR REPLACE FUNCTION public.provision_native_profile_atomic(
  p_userid text, p_email text, p_username text, p_phone text,
  p_countrycode text, p_refer text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_profile public.users%ROWTYPE;
  v_referrer public.users%ROWTYPE;
  v_code text;
  v_refer text := nullif(trim(p_refer), '');
  v_constraint text;
BEGIN
  IF nullif(trim(p_userid),'') IS NULL OR nullif(trim(p_email),'') IS NULL THEN
    RAISE EXCEPTION 'Account identity required';
  END IF;
  IF nullif(trim(p_username),'') IS NULL OR length(trim(p_username)) > 64
      OR trim(p_username) ~ '[[:space:]]' OR length(coalesce(p_phone,'')) > 40
      OR p_countrycode IS NULL OR trim(p_countrycode) !~ '^[+][0-9]{1,4}$' THEN
    RAISE EXCEPTION 'Invalid signup fields';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_userid, 8124));
  SELECT * INTO v_profile FROM public.users WHERE userid=p_userid FOR UPDATE;
  IF FOUND THEN
    INSERT INTO public.referral(refer,count) VALUES(v_profile.newrefer,0)
      ON CONFLICT(refer) DO NOTHING;
    RETURN jsonb_build_object('newrefer',v_profile.newrefer,'created',false);
  END IF;
  IF v_refer IS NOT NULL THEN
    SELECT * INTO v_referrer FROM public.users WHERE newrefer=v_refer;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
  END IF;
  FOR attempt IN 1..10 LOOP
    v_code := (floor(pg_catalog.random()*9000000)+1000000)::bigint::text;
    BEGIN
      INSERT INTO public.users(userid,uid,username,email,phone,countrycode,refer,newrefer,lvla,lvlb,balance)
      VALUES(p_userid,'uid_'||pg_catalog.gen_random_uuid()::text,trim(p_username),p_email,
        trim(p_phone),trim(p_countrycode),v_refer,v_code,v_referrer.refer,v_referrer.lvla,5000)
      RETURNING * INTO v_profile;
      INSERT INTO public.referral(refer,count) VALUES(v_code,0);
      RETURN jsonb_build_object('newrefer',v_code,'created',true);
    EXCEPTION WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint=CONSTRAINT_NAME;
      IF v_constraint <> 'users_newrefer_key' THEN RAISE; END IF;
    END;
  END LOOP;
  RAISE EXCEPTION 'Unable to create referral code';
END;
$$;
REVOKE ALL ON FUNCTION public.provision_native_profile_atomic(text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.provision_native_profile_atomic(text,text,text,text,text,text) TO service_role;

-- Preserve deployed odds, idempotency, locking and privilege rules while
-- updating every underlying quote/placement function, including overloads.
DO $$
DECLARE fn record; definition text; updated_definition text;
BEGIN
  FOR fn IN
    SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('place_bet_atomic','native_bet_quote','place_native_bet_atomic','place_bet_with_expected_odd_atomic')
  LOOP
    definition := pg_get_functiondef(fn.oid);
    updated_definition := regexp_replace(definition, 'p_stake\s*<\s*2500\M', 'p_stake < 5000', 'g');
    IF updated_definition <> definition THEN EXECUTE updated_definition; END IF;
  END LOOP;
END;
$$;
COMMIT;
