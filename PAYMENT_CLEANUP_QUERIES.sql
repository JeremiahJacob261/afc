-- Payment cleanup diagnostics for rows affected before atomic finance RPCs.
-- Review every result set before running any repair. Do not auto-credit or
-- auto-debit balances unless the ledger evidence is unambiguous.

-- 1) Stuck processing rows older than 30 minutes.
SELECT
  id,
  uid,
  username,
  type,
  amount,
  sent,
  processing_started_at,
  processed_action,
  processed_at,
  created_at
FROM notification
WHERE lower(COALESCE(sent, 'pending')) = 'processing'
  AND COALESCE(processing_started_at, created_at, time) < now() - interval '30 minutes'
ORDER BY COALESCE(processing_started_at, created_at, time) ASC;

-- Optional repair for rows confirmed to have no balance/stat/activity mutation:
-- UPDATE notification
-- SET sent = 'pending',
--     processing_started_at = NULL
-- WHERE id IN (
--   -- reviewed notification IDs only
-- );

-- 2) Terminal finance rows with missing finance activity logs.
SELECT
  n.id,
  n.uid,
  n.username,
  n.type,
  n.amount,
  n.sent,
  n.processed_action,
  n.processed_at
FROM notification n
WHERE lower(COALESCE(n.sent, 'pending')) IN ('success', 'true', 'completed')
  AND lower(COALESCE(n.type, '')) IN ('deposit', 'withdraw', 'withdrawer')
  AND NOT EXISTS (
    SELECT 1
    FROM activa a
    WHERE a.username = n.username
      AND a.code = 'finance'
      AND a.type = CASE WHEN lower(n.type) = 'deposit' THEN 'deposit' ELSE 'withdraw' END
      AND a.created_at >= COALESCE(n.processed_at, n.created_at, n.time) - interval '10 minutes'
      AND a.created_at <= COALESCE(n.processed_at, n.created_at, n.time) + interval '10 minutes'
  )
ORDER BY COALESCE(n.processed_at, n.created_at, n.time) DESC;

-- 3) Duplicate first-deposit bonus logs for the same user.
SELECT
  username,
  COUNT(*) AS bonus_log_count,
  SUM(COALESCE(amount, 0)) AS total_logged_bonus,
  ARRAY_AGG(id ORDER BY created_at) AS activity_ids,
  MIN(created_at) AS first_logged_at,
  MAX(created_at) AS last_logged_at
FROM activa
WHERE code = 'firstdepositbonus'
  AND type = 'depbonus'
GROUP BY username
HAVING COUNT(*) > 1
ORDER BY bonus_log_count DESC, username;

-- 4) Pending/processing withdrawals to review for a corresponding held balance.
-- Compare the gross held amount against user history before rejecting/refunding.
SELECT
  n.id,
  n.uid,
  n.username,
  n.amount AS payout_amount,
  round((COALESCE(NULLIF(n.amount::TEXT, '')::NUMERIC, 0) / 0.95)::NUMERIC, 3) AS gross_held_amount,
  u.balance AS current_balance,
  n.sent,
  n.created_at
FROM notification n
JOIN users u ON u.username = n.username
WHERE lower(COALESCE(n.type, '')) IN ('withdraw', 'withdrawer')
  AND lower(COALESCE(n.sent, 'pending')) IN ('pending', 'processing')
ORDER BY n.created_at DESC;

-- 5) Successful payments missing processed metadata after the atomic RPC rollout.
SELECT
  id,
  uid,
  username,
  type,
  amount,
  sent,
  processed_action,
  processed_at,
  created_at
FROM notification
WHERE lower(COALESCE(sent, 'pending')) IN ('success', 'failed', 'true', 'false', 'completed')
  AND (processed_action IS NULL OR processed_at IS NULL)
ORDER BY COALESCE(created_at, time) DESC;
