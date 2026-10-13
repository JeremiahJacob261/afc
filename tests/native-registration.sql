-- Run as a transaction-capable administrator. All fixture data is rolled back.
BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE
  v_id text := pg_catalog.gen_random_uuid()::text;
  v_username text := 'native_regression_' || replace(v_id, '-', '');
  v_result jsonb;
  v_retry jsonb;
BEGIN
  -- The authenticated API supplies identity; this role must not need auth.users access.
  v_result := public.provision_native_profile_atomic(
    v_id, v_username || '@example.invalid', v_username, '9123456789', '+95', NULL);
  IF v_result->>'created' <> 'true' THEN RAISE EXCEPTION 'Expected profile creation'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.referral WHERE refer = v_result->>'newrefer') THEN
    RAISE EXCEPTION 'Missing atomic referral record';
  END IF;
  v_retry := public.provision_native_profile_atomic(
    v_id, v_username || '@example.invalid', v_username, '9123456789', '+95', NULL);
  IF v_retry->>'created' <> 'false' OR v_retry->>'newrefer' <> v_result->>'newrefer' THEN
    RAISE EXCEPTION 'Profile retry was not idempotent';
  END IF;
  BEGIN
    PERFORM public.provision_native_profile_atomic(v_id, 'test@example.invalid', 'two words', '9123456789', '+95', NULL);
    RAISE EXCEPTION 'Whitespace username accepted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Invalid signup fields' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.provision_native_profile_atomic(v_id, 'test@example.invalid', v_username, '9123456789', '95', NULL);
    RAISE EXCEPTION 'Invalid country code accepted' USING ERRCODE = 'XX000';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Invalid signup fields' THEN RAISE; END IF;
  END;
  IF has_function_privilege('anon', 'public.provision_native_profile_atomic(text,text,text,text,text,text)', 'execute')
    OR has_function_privilege('authenticated', 'public.provision_native_profile_atomic(text,text,text,text,text,text)', 'execute') THEN
    RAISE EXCEPTION 'Profile provisioning exposed to client roles';
  END IF;
END;
$$;
SELECT 'PASS: native profile creation, retry, validation and server-only access' AS result;
ROLLBACK;
