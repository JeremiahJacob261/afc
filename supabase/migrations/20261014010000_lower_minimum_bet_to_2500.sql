-- Lower the minimum stake for every deployed betting RPC to 2,500 MMK.
-- Recreate the existing function definitions in place so this also updates
-- databases where the original function migration has already been applied.
DO $$
DECLARE
  fn record;
  definition text;
  updated_definition text;
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('place_bet_atomic', 'native_bet_quote', 'place_native_bet_atomic')
  LOOP
    SELECT pg_get_functiondef(fn.oid) INTO definition;
    updated_definition := replace(definition, 'p_stake < 5000', 'p_stake < 2500');
    updated_definition := replace(updated_definition, 'p_stake<5000', 'p_stake<2500');
    IF updated_definition <> definition THEN
      EXECUTE updated_definition;
    END IF;
  END LOOP;
END;
$$;
