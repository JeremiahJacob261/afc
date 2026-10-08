-- Run against a disposable PostgreSQL database with the wheel cash migration applied.
-- All test fixtures and effects are rolled back. No push delivery is invoked.
BEGIN;
DO $test$
DECLARE
  test_user uuid := gen_random_uuid();
  name text := 'wheel-test-' || test_user::text;
  rev integer;
  result jsonb;
  prize record;
  starting_count integer;
  before_balance numeric;
BEGIN
  INSERT INTO auth.users (id) VALUES (test_user);
  INSERT INTO public.users (userid, uid, username, email, newrefer, balance)
  VALUES (test_user::text, name, name, name || '@example.invalid', name, 99999.9999);
  SELECT revision INTO rev FROM public.wheel_settings WHERE id = 1;

  result := public.spin_wheel_atomic(test_user, rev, 0);
  IF result->>'status' <> 'insufficient_balance'
    OR EXISTS (SELECT 1 FROM public.wheel_spin_state WHERE user_id = test_user)
    OR EXISTS (SELECT 1 FROM public.wheel_spin_rewards WHERE user_id = test_user) THEN
    RAISE EXCEPTION 'Below-threshold spin consumed or credited a spin';
  END IF;

  UPDATE public.users SET balance = 100000 WHERE userid = test_user::text;
  result := public.spin_wheel_atomic(test_user, rev - 1, 0);
  IF result->>'status' <> 'wheel_updated'
    OR EXISTS (SELECT 1 FROM public.wheel_spin_state WHERE user_id = test_user) THEN
    RAISE EXCEPTION 'Stale wheel consumed a spin';
  END IF;

  FOR prize IN SELECT * FROM public.wheel_items ORDER BY position LOOP
    DELETE FROM public.wheel_spin_state WHERE user_id = test_user;
    UPDATE public.users SET balance = 100000 WHERE userid = test_user::text;
    result := public.spin_wheel_atomic(test_user, rev, prize.position);
    IF result->>'status' <> 'success' OR (result->>'amount')::bigint <> prize.amount
      OR (result->>'prizeIndex')::integer <> prize.position
      OR (SELECT balance FROM public.users WHERE userid = test_user::text) <> 100000 + prize.amount THEN
      RAISE EXCEPTION 'Incorrect payout for slice %: %', prize.position, result;
    END IF;
    SELECT count(*) INTO starting_count FROM public.wheel_spin_rewards WHERE user_id = test_user;
    result := public.spin_wheel_atomic(test_user, rev, prize.position);
    IF result->>'status' <> 'cooldown'
      OR (SELECT count(*) FROM public.wheel_spin_rewards WHERE user_id = test_user) <> starting_count THEN
      RAISE EXCEPTION 'Repeated request credited another award';
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM public.app_notifications WHERE recipient_username = name) <> 8
    OR (SELECT count(*) FROM public.wheel_spin_rewards WHERE user_id = test_user) <> 8 THEN
    RAISE EXCEPTION 'Awards and notifications must be created exactly once';
  END IF;

  -- Clock is evaluated after acquiring locks; the exact 24-hour boundary is eligible.
  UPDATE public.wheel_spin_state SET spun_at = clock_timestamp() - interval '24 hours' WHERE user_id = test_user;
  UPDATE public.users SET balance = 100001 WHERE userid = test_user::text;
  result := public.spin_wheel_atomic(test_user, rev, 4);
  IF result->>'status' <> 'success' OR (result->>'balance')::numeric <> 100011 THEN
    RAISE EXCEPTION '24-hour boundary or above-threshold balance failed';
  END IF;

  -- A legacy visual-only result keeps its cooldown and has no retroactive payout.
  UPDATE public.wheel_spin_state SET prize_label = 'iPhone 17', prize_amount = NULL WHERE user_id = test_user;
  SELECT balance INTO before_balance FROM public.users WHERE userid = test_user::text;
  result := public.spin_wheel_atomic(test_user, rev, 0);
  IF result->>'status' <> 'cooldown'
    OR (SELECT balance FROM public.users WHERE userid = test_user::text) <> before_balance THEN
    RAISE EXCEPTION 'Legacy cooldown was lost';
  END IF;

  -- Invalid admin amounts fail without replacing the configuration or advancing revision.
  BEGIN
    PERFORM public.replace_wheel_configuration(rev, '[{"amount":1.5,"color":"#ffffff"},{"amount":500,"color":"#ffffff"}]'::jsonb);
    RAISE EXCEPTION 'Fractional amount accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Fractional amount accepted' THEN RAISE; END IF;
  END;
  IF (SELECT revision FROM public.wheel_settings WHERE id = 1) <> rev
    OR (SELECT count(*) FROM public.wheel_items) <> 8 THEN
    RAISE EXCEPTION 'Invalid admin save altered configuration';
  END IF;
END;
$test$;

-- Fail the last write in the award transaction to verify earlier writes roll back too.
CREATE FUNCTION public.wheel_test_notification_failure() RETURNS trigger LANGUAGE plpgsql AS $fail$
BEGIN
  IF NEW.event_type = 'wheel_reward' THEN RAISE EXCEPTION 'Simulated notification failure'; END IF;
  RETURN NEW;
END;
$fail$;
CREATE TRIGGER wheel_test_notification_failure BEFORE INSERT ON public.app_notifications
FOR EACH ROW EXECUTE FUNCTION public.wheel_test_notification_failure();
DO $test$
DECLARE
  test_user uuid := gen_random_uuid();
  name text := 'wheel-rollback-' || test_user::text;
  rev integer;
BEGIN
  INSERT INTO auth.users (id) VALUES (test_user);
  INSERT INTO public.users (userid, uid, username, email, newrefer, balance)
  VALUES (test_user::text, name, name, name || '@example.invalid', name, 100000);
  SELECT revision INTO rev FROM public.wheel_settings WHERE id = 1;
  BEGIN
    PERFORM public.spin_wheel_atomic(test_user, rev, 0);
    RAISE EXCEPTION 'Expected notification failure';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Simulated notification failure' THEN RAISE; END IF;
  END;
  IF (SELECT balance FROM public.users WHERE userid = test_user::text) <> 100000
    OR EXISTS (SELECT 1 FROM public.wheel_spin_state WHERE user_id = test_user)
    OR EXISTS (SELECT 1 FROM public.wheel_spin_rewards WHERE user_id = test_user)
    OR EXISTS (SELECT 1 FROM public.app_notifications WHERE recipient_username = name) THEN
    RAISE EXCEPTION 'Failed notification did not roll back the entire award';
  END IF;
END;
$test$;
ROLLBACK;
