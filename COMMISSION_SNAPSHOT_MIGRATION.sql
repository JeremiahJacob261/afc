-- Run this entire file once in the Supabase SQL Editor.
--
-- Why: place_bet_atomic snapshots the level-one referral commission on the bet
-- as 0.05 * profit, but settle_reverse_match_atomic actually pays 0.06 * profit.
-- The stored aone column has understated every level-one payout since the
-- commission rate was raised. This corrects the rate for new bets and repairs
-- the existing snapshot.
--
-- aone = 0.06 * profit, atwo = 0.03 * profit, athree = 0.01 * profit.
-- Only aone is wrong; atwo and athree already match what is paid.

-- Repair the snapshot on existing settled and unsettled bets.
-- aone is 0 when the bettor had no referrer, so only non-zero rows are touched.
UPDATE public.placed
SET aone = round(COALESCE(profit, 0) * 0.06, 4)
WHERE COALESCE(aone, 0) > 0;

CREATE OR REPLACE FUNCTION public.place_bet_atomic(
  p_userid TEXT,
  p_match_id TEXT,
  p_picked TEXT,
  p_stake NUMERIC,
  p_client_bet_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  user_row users%ROWTYPE;
  match_row bets%ROWTYPE;
  market_key TEXT;
  market_label TEXT;
  base_odd NUMERIC;
  final_odd NUMERIC;
  profit_amount NUMERIC;
  next_balance NUMERIC;
  referral_count INTEGER;
  vip_level INTEGER;
  start_ms NUMERIC;
  now_ms NUMERIC;
  inserted_betid TEXT;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_match_id IS NULL OR btrim(p_match_id) = '' THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF p_stake IS NULL OR p_stake < 1 THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;

  market_key := public.score_market_key(p_picked);
  market_label := public.score_market_label(p_picked);
  IF market_key IS NULL OR market_label IS NULL THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;

  SELECT *
  INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF COALESCE(user_row.balance, 0) < p_stake THEN
    RAISE EXCEPTION 'You do not have enough USDT to complete this bet';
  END IF;

  IF COALESCE(user_row.gcount, 0) > 2 THEN
    RAISE EXCEPTION 'You have reached the maximum number of bets for today';
  END IF;

  SELECT *
  INTO match_row
  FROM bets
  WHERE match_id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF COALESCE(match_row.verified, FALSE) THEN
    RAISE EXCEPTION 'Match already settled';
  END IF;

  start_ms := COALESCE(match_row.tsgmt, 0);
  IF start_ms > 0 AND start_ms < 1000000000000 THEN
    start_ms := start_ms * 1000;
  END IF;
  now_ms := EXTRACT(EPOCH FROM now()) * 1000;

  IF start_ms <= now_ms THEN
    RAISE EXCEPTION 'This Match has expired';
  END IF;

  base_odd := COALESCE(NULLIF(to_jsonb(match_row) ->> market_key, '')::NUMERIC, 0);
  IF base_odd <= 0 THEN
    RAISE EXCEPTION 'This market is not available';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO referral_count
  FROM users
  WHERE refer = user_row.newrefer
    AND public.is_active_member(balance);

  vip_level := public.vip_level_for_user(user_row.totald, referral_count);
  final_odd := round(base_odd * (1 + public.vip_bonus_for_level(vip_level)), 3);
  profit_amount := round((final_odd * p_stake) / 100, 2);

  IF p_client_bet_id IS NULL THEN
    INSERT INTO placed (
      match_id, market, username, started, stake, profit, aim,
      home, away, time, date, odd, ihome, iaway,
      levelone, leveltwo, levelthree, aone, atwo, athree
    )
    VALUES (
      match_row.match_id, market_label, user_row.username, FALSE, p_stake, profit_amount, profit_amount,
      match_row.home, match_row.away, match_row.time, match_row.date, final_odd, match_row.ihome, match_row.iaway,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN '7705966' ELSE user_row.refer END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN '7705966' ELSE user_row.lvla END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN '7705966' ELSE user_row.lvlb END,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.06 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN 0 ELSE 0.03 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN 0 ELSE 0.01 * profit_amount END
    )
    RETURNING betid::TEXT INTO inserted_betid;
  ELSE
    INSERT INTO placed (
      betid, match_id, market, username, started, stake, profit, aim,
      home, away, time, date, odd, ihome, iaway,
      levelone, leveltwo, levelthree, aone, atwo, athree
    )
    VALUES (
      p_client_bet_id, match_row.match_id, market_label, user_row.username, FALSE, p_stake, profit_amount, profit_amount,
      match_row.home, match_row.away, match_row.time, match_row.date, final_odd, match_row.ihome, match_row.iaway,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN '7705966' ELSE user_row.refer END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN '7705966' ELSE user_row.lvla END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN '7705966' ELSE user_row.lvlb END,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.06 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN 0 ELSE 0.03 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN 0 ELSE 0.01 * profit_amount END
    )
    ON CONFLICT (betid) DO NOTHING
    RETURNING betid::TEXT INTO inserted_betid;

    IF inserted_betid IS NULL THEN
      SELECT betid::TEXT
      INTO inserted_betid
      FROM placed
      WHERE betid::TEXT = p_client_bet_id::TEXT
        AND username = user_row.username
        AND match_id = match_row.match_id;

      IF inserted_betid IS NULL THEN
        RAISE EXCEPTION 'Duplicate bet id';
      END IF;

      RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Bet Successful',
        'betid', inserted_betid,
        'balance', user_row.balance,
        'profit', profit_amount,
        'odd', final_odd,
        'reused', TRUE
      );
    END IF;
  END IF;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_stake,
      gcount = COALESCE(gcount, 0) + 1
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  INSERT INTO useractivity (type, amount, "user", match_id, stake, profit, market)
  VALUES ('bets', p_stake + profit_amount, user_row.username, match_row.match_id, p_stake, profit_amount, market_label);

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Bet Successful',
    'betid', inserted_betid,
    'balance', next_balance,
    'profit', profit_amount,
    'odd', final_odd
  );
END;
$$;
