-- Run this entire file once in the Supabase SQL Editor.
--
-- Why: settlement currently records a refunded company-market bet with the same
-- `won = 'true'` value as a real win, and pays no referral commission on it.
-- Any consumer reading `placed.won` alone cannot tell a win from a refund, so
-- the web UI reports both as "Won". This stores the actual outcome on the bet.
--
-- Outcomes: 'won'     -> stake + profit paid, referral commission paid
--           'refunded'-> stake returned, no profit, no referral commission
--           'lost'    -> stake forfeited
--           NULL      -> not settled yet

ALTER TABLE public.placed
  ADD COLUMN IF NOT EXISTS settlement_outcome TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'placed_settlement_outcome_check'
  ) THEN
    ALTER TABLE public.placed
      ADD CONSTRAINT placed_settlement_outcome_check
      CHECK (
        settlement_outcome IS NULL
        OR settlement_outcome IN ('won', 'refunded', 'lost')
      );
  END IF;
END;
$$;

-- Backfill in this order so no row is written twice.
-- Refunds first: they are the only case that also carries won = 'true'.

-- A refund is a bet that landed on the house's protected market of a company
-- match. placed.market holds the label ("1 - 0"); bets.comarket holds the key
-- ("onenil"), so both sides go through score_market_key to compare.
UPDATE public.placed p
SET settlement_outcome = 'refunded'
FROM public.bets b
WHERE p.match_id = b.match_id
  AND COALESCE(b.company, FALSE)
  AND b.comarket IS NOT NULL
  AND p.won = 'true'
  AND p.settlement_outcome IS NULL
  AND public.score_market_key(p.market) = public.score_market_key(b.comarket);

-- Any other successful bet is a genuine win.
UPDATE public.placed
SET settlement_outcome = 'won'
WHERE won = 'true'
  AND settlement_outcome IS NULL;

UPDATE public.placed
SET settlement_outcome = 'lost'
WHERE won = 'false'
  AND settlement_outcome IS NULL;

CREATE INDEX IF NOT EXISTS idx_placed_settlement_outcome
  ON public.placed (username, settlement_outcome);

CREATE OR REPLACE FUNCTION public.settle_reverse_match_atomic(
  p_match_id TEXT,
  p_home_score INTEGER,
  p_away_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  match_row bets%ROWTYPE;
  bet_row placed%ROWTYPE;
  actual_label TEXT;
  actual_key TEXT;
  protected_key TEXT;
  selected_key TEXT;
  payout_amount NUMERIC;
  bonus_amount NUMERIC;
  total_bets INTEGER := 0;
  won_count INTEGER := 0;
  lost_count INTEGER := 0;
  refunded_count INTEGER := 0;
  user_refers RECORD;
BEGIN
  IF p_match_id IS NULL OR btrim(p_match_id) = '' THEN
    RAISE EXCEPTION 'Missing match id';
  END IF;

  actual_label := public.score_market_from_score(p_home_score, p_away_score);
  actual_key := public.score_market_key(actual_label);

  SELECT *
  INTO match_row
  FROM bets
  WHERE match_id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO total_bets
  FROM placed
  WHERE match_id = p_match_id;

  IF COALESCE(match_row.verified, FALSE) THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'alreadySettled', TRUE,
      'matchId', p_match_id,
      'result', match_row.results,
      'resultKey', public.score_market_key(match_row.results),
      'company', COALESCE(match_row.company, FALSE),
      'protectedMarket', public.score_market_label(match_row.comarket),
      'summary', jsonb_build_object('won', 0, 'lost', 0, 'refunded', 0, 'total', total_bets)
    );
  END IF;

  IF COALESCE(match_row.company, FALSE) THEN
    protected_key := public.score_market_key(match_row.comarket);
    IF protected_key IS NULL THEN
      RAISE EXCEPTION 'Company match is missing a supported protected market';
    END IF;
  END IF;

  FOR bet_row IN
    SELECT *
    FROM placed
    WHERE match_id = p_match_id
      AND won = 'null'
    FOR UPDATE
  LOOP
    selected_key := public.score_market_key(bet_row.market);
    IF selected_key IS NULL THEN
      RAISE EXCEPTION 'Unsupported placed market for bet %', bet_row.betid;
    END IF;

    UPDATE users
    SET betspend = COALESCE(betspend, 0) + COALESCE(bet_row.stake, 0)
    WHERE username = bet_row.username;

    IF selected_key <> actual_key THEN
      payout_amount := COALESCE(bet_row.stake, 0) + COALESCE(bet_row.aim, 0);

      UPDATE users
      SET balance = COALESCE(balance, 0) + payout_amount,
          betwon = COALESCE(betwon, 0) + payout_amount
      WHERE username = bet_row.username;

      UPDATE placed
      SET won = 'true',
          settlement_outcome = 'won'
      WHERE betid = bet_row.betid;

      INSERT INTO activa (code, username, amount, type)
      VALUES ('bet', bet_row.username, payout_amount, 'rebate');

      SELECT refer, lvla, lvlb
      INTO user_refers
      FROM users
      WHERE username = bet_row.username;

      IF user_refers.refer IS NOT NULL AND user_refers.refer <> '' AND user_refers.refer <> 'null' THEN
        bonus_amount := COALESCE(bet_row.profit, 0) * 0.06;
        UPDATE users
        SET balance = COALESCE(balance, 0) + bonus_amount
        WHERE newrefer = user_refers.refer;
        IF FOUND THEN
          INSERT INTO activa (username, type, amount, code)
          VALUES (bet_row.username, 'affbonus', bonus_amount, user_refers.refer);
        END IF;
      END IF;

      IF user_refers.lvla IS NOT NULL AND user_refers.lvla <> '' AND user_refers.lvla <> 'null' THEN
        bonus_amount := COALESCE(bet_row.profit, 0) * 0.03;
        UPDATE users
        SET balance = COALESCE(balance, 0) + bonus_amount
        WHERE newrefer = user_refers.lvla;
        IF FOUND THEN
          INSERT INTO activa (username, type, amount, code)
          VALUES (bet_row.username, 'affbonus', bonus_amount, user_refers.lvla);
        END IF;
      END IF;

      IF user_refers.lvlb IS NOT NULL AND user_refers.lvlb <> '' AND user_refers.lvlb <> 'null' THEN
        bonus_amount := COALESCE(bet_row.profit, 0) * 0.01;
        UPDATE users
        SET balance = COALESCE(balance, 0) + bonus_amount
        WHERE newrefer = user_refers.lvlb;
        IF FOUND THEN
          INSERT INTO activa (username, type, amount, code)
          VALUES (bet_row.username, 'affbonus', bonus_amount, user_refers.lvlb);
        END IF;
      END IF;

      won_count := won_count + 1;
    ELSIF protected_key IS NOT NULL AND protected_key = selected_key THEN
      -- House rule: a company match refunds the protected market rather than
      -- paying it. Stake returns, no profit, no referral commission.
      UPDATE users
      SET balance = COALESCE(balance, 0) + COALESCE(bet_row.stake, 0)
      WHERE username = bet_row.username;

      UPDATE placed
      SET won = 'true',
          settlement_outcome = 'refunded'
      WHERE betid = bet_row.betid;

      refunded_count := refunded_count + 1;
    ELSE
      UPDATE placed
      SET won = 'false',
          settlement_outcome = 'lost'
      WHERE betid = bet_row.betid;

      lost_count := lost_count + 1;
    END IF;
  END LOOP;

  UPDATE bets
  SET verified = TRUE,
      results = actual_label
  WHERE match_id = p_match_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'alreadySettled', FALSE,
    'matchId', p_match_id,
    'result', actual_label,
    'resultKey', actual_key,
    'company', COALESCE(match_row.company, FALSE),
    'protectedMarket', CASE WHEN protected_key IS NULL THEN NULL ELSE public.score_market_label(protected_key) END,
    'summary', jsonb_build_object('won', won_count, 'lost', lost_count, 'refunded', refunded_count, 'total', total_bets)
  );
END;
$$;
