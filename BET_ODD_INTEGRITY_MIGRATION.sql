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
