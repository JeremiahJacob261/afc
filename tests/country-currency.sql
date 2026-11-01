-- Run after the account-currency migration, using an administrator connection.
-- Fixture profiles and referrals are rolled back.
BEGIN;
DO $$ BEGIN
 IF has_function_privilege('anon','public.provision_country_profile_atomic(text,text,text,text,text,text,text)','EXECUTE')
 OR has_function_privilege('authenticated','public.provision_country_profile_atomic(text,text,text,text,text,text,text)','EXECUTE') THEN
  RAISE EXCEPTION 'Country provisioning RPC must remain server-only';
 END IF;
END; $$;
SET LOCAL ROLE service_role;
DO $$
DECLARE fixture record; identity text; username text; result jsonb; code text; iso text;
BEGIN
 FOR fixture IN SELECT * FROM (VALUES ('MM','+95','MMK'),('CI','+225','FCFA'),('CM','+237','FCFA'),('ZM','+260','ZMW'),('US','+1','USDT')) AS cases(country,dial,currency) LOOP
  identity := gen_random_uuid()::text;
  username := 'currency_test_' || replace(identity,'-','');
  result := public.provision_country_profile_atomic(identity,username || '@example.invalid',username,'9123456789',fixture.dial,NULL,fixture.country);
  SELECT currency_code,country_iso INTO code,iso FROM public.users WHERE userid=identity;
  IF code <> fixture.currency OR iso <> fixture.country THEN RAISE EXCEPTION 'Unexpected signup currency for %',fixture.country; END IF;
  -- Profile recovery cannot change the selected country or currency.
  PERFORM public.provision_country_profile_atomic(identity,username || '@example.invalid',username,'9123456789','+260',NULL,'ZM');
  IF (SELECT currency_code FROM public.users WHERE userid=identity) <> fixture.currency THEN RAISE EXCEPTION 'Retry changed account currency'; END IF;
 END LOOP;
END; $$;
ROLLBACK;
