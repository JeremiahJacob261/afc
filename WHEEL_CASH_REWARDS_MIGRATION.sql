-- Apply after the wheel-items and MMK-ledger migrations, before deploying the cash wheel.
BEGIN;

ALTER TABLE public.wheel_items ADD COLUMN amount bigint;
-- Preserve the original slice order and replace the phone with 50,000 MMK.
UPDATE public.wheel_items SET
  amount = (ARRAY[50000,5000,20000,100000,10,500,1000,30000]::bigint[])[position + 1],
  image_url = '/assets/wheel/cash-' || (ARRAY['violet','purple','cyan','magenta','emerald','gold','orange','rose'])[position + 1] || '.png'
WHERE position BETWEEN 0 AND 7;
DELETE FROM public.wheel_items WHERE position > 7;
INSERT INTO public.wheel_items (position, label, amount, image_url, color)
SELECT position, amount::text || ' MMK', amount,
  '/assets/wheel/cash-' || color_name || '.png', color
FROM (VALUES
  (0,50000,'violet','#d047dc'), (1,5000,'purple','#a840d6'),
  (2,20000,'cyan','#1daedc'), (3,100000,'magenta','#f235a0'),
  (4,10,'emerald','#29dc45'), (5,500,'gold','#ffe700'),
  (6,1000,'orange','#eb7608'), (7,30000,'rose','#ef5f9d')
) AS prizes(position,amount,color_name,color)
WHERE NOT EXISTS (SELECT 1 FROM public.wheel_items existing WHERE existing.position = prizes.position);
UPDATE public.wheel_items SET label = to_char(amount, 'FM99,999,999,999,990') || ' MMK'
WHERE amount IS NOT NULL;
ALTER TABLE public.wheel_items ALTER COLUMN amount SET NOT NULL;
ALTER TABLE public.wheel_items ADD CONSTRAINT wheel_items_amount_check CHECK (amount BETWEEN 1 AND 99999999999);
UPDATE public.wheel_settings SET revision = revision + 1 WHERE id = 1;

CREATE TABLE public.wheel_spin_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, -- Snapshot ID; admin replacements must not delete award history.
  revision integer NOT NULL,
  prize_index smallint NOT NULL CHECK (prize_index BETWEEN 0 AND 11),
  amount bigint NOT NULL CHECK (amount BETWEEN 1 AND 99999999999),
  prize_label text NOT NULL,
  spun_at timestamptz NOT NULL,
  balance_before numeric(15,4) NOT NULL,
  balance_after numeric(15,4) NOT NULL,
  CHECK (balance_after = balance_before + amount),
  UNIQUE (user_id, spun_at)
);
ALTER TABLE public.wheel_spin_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wheel_spin_rewards FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.wheel_spin_rewards TO service_role;
ALTER TABLE public.wheel_spin_state ADD COLUMN prize_amount bigint;
-- Existing visual-only results retain a NULL amount and their original cooldown.

CREATE OR REPLACE FUNCTION public.read_wheel_configuration()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $function$
  SELECT jsonb_build_object('revision', settings.revision, 'items', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', item.id, 'amount', item.amount,
      'label', to_char(item.amount, 'FM99,999,999,999,990') || ' MMK',
      'imageUrl', item.image_url, 'color', item.color
    ) ORDER BY item.position) FROM public.wheel_items item
  ), '[]'::jsonb)) FROM public.wheel_settings settings WHERE settings.id = 1;
$function$;

CREATE OR REPLACE FUNCTION public.replace_wheel_configuration(p_expected_revision integer, p_items jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
DECLARE
  current_revision integer;
  item jsonb;
  ordinal bigint;
  item_amount bigint;
  item_image text;
  item_color text;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'The wheel needs between 2 and 12 items';
  END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 2 AND 12 THEN
    RAISE EXCEPTION 'The wheel needs between 2 and 12 items';
  END IF;
  SELECT revision INTO current_revision FROM public.wheel_settings WHERE id = 1 FOR UPDATE;
  IF current_revision IS DISTINCT FROM p_expected_revision THEN
    RAISE EXCEPTION 'The wheel changed since you opened it. Reload and try again.';
  END IF;
  DELETE FROM public.wheel_items WHERE position >= 0;
  FOR item, ordinal IN SELECT value, ordinality FROM jsonb_array_elements(p_items) WITH ORDINALITY LOOP
    IF COALESCE(item->>'amount', '') !~ '^[0-9]{1,11}$' THEN
      RAISE EXCEPTION 'Each wheel amount must be a positive whole MMK amount';
    END IF;
    item_amount := (item->>'amount')::bigint;
    item_image := btrim(COALESCE(item->>'imageUrl', ''));
    item_color := COALESCE(item->>'color', '');
    IF item_amount NOT BETWEEN 1 AND 99999999999
       OR char_length(item_image) > 2048
       OR (item_image <> '' AND item_image !~ '^(/[^/]|https://)')
       OR item_color !~ '^#[0-9A-Fa-f]{6}$' THEN
      RAISE EXCEPTION 'Invalid wheel item at position %', ordinal;
    END IF;
    INSERT INTO public.wheel_items (id, position, label, amount, image_url, color)
    VALUES (COALESCE(NULLIF(item->>'id', '')::uuid, gen_random_uuid()), ordinal - 1,
      to_char(item_amount, 'FM99,999,999,999,990') || ' MMK', item_amount, item_image, item_color);
  END LOOP;
  UPDATE public.wheel_settings SET revision = revision + 1 WHERE id = 1 RETURNING revision INTO current_revision;
  RETURN current_revision;
END;
$function$;

CREATE FUNCTION public.spin_wheel_atomic(p_user_id uuid, p_expected_revision integer, p_prize_index integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
DECLARE
  user_row public.users%ROWTYPE;
  spin_row public.wheel_spin_state%ROWTYPE;
  prize_row public.wheel_items%ROWTYPE;
  current_revision integer;
  spin_time timestamptz;
  available_at timestamptz;
  reward_id uuid;
  notification_id bigint;
  prize_label text;
  notification_body text;
  notification_data jsonb;
  balance_after numeric(15,4);
  state jsonb;
BEGIN
  -- Serialize with bets, withdrawals, and other spins on this account.
  SELECT * INTO user_row FROM public.users WHERE userid = p_user_id::text FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  -- Multiple users can spin concurrently; configuration edits take an exclusive lock.
  SELECT revision INTO current_revision FROM public.wheel_settings WHERE id = 1 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wheel items are unavailable'; END IF;
  spin_time := clock_timestamp();
  SELECT * INTO spin_row FROM public.wheel_spin_state WHERE user_id = p_user_id;
  available_at := spin_row.spun_at + interval '24 hours';
  state := jsonb_build_object('balance', COALESCE(user_row.balance, 0),
    'minimumBalance', 100000, 'eligible', COALESCE(user_row.balance, 0) >= 100000,
    'nextSpinAt', available_at, 'canSpin', false);
  IF COALESCE(user_row.balance, 0) < 100000 THEN
    RETURN state || jsonb_build_object('status', 'insufficient_balance');
  END IF;
  IF available_at > spin_time THEN
    RETURN state || jsonb_build_object('status', 'cooldown');
  END IF;
  IF current_revision IS DISTINCT FROM p_expected_revision THEN
    RETURN state || public.read_wheel_configuration() || jsonb_build_object('status', 'wheel_updated');
  END IF;
  SELECT * INTO prize_row FROM public.wheel_items WHERE position = p_prize_index;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid wheel prize index'; END IF;
  prize_label := to_char(prize_row.amount, 'FM99,999,999,999,990') || ' MMK';
  balance_after := COALESCE(user_row.balance, 0) + prize_row.amount;
  UPDATE public.users SET balance = balance_after, updated_at = spin_time WHERE id = user_row.id;
  INSERT INTO public.wheel_spin_rewards (user_id, item_id, revision, prize_index, amount,
    prize_label, spun_at, balance_before, balance_after)
  VALUES (p_user_id, prize_row.id, current_revision, p_prize_index, prize_row.amount,
    prize_label, spin_time, COALESCE(user_row.balance, 0), balance_after)
  RETURNING id INTO reward_id;
  INSERT INTO public.wheel_spin_state (user_id, spun_at, prize_index, prize_label, prize_amount)
  VALUES (p_user_id, spin_time, p_prize_index, prize_label, prize_row.amount)
  ON CONFLICT (user_id) DO UPDATE SET spun_at = EXCLUDED.spun_at,
    prize_index = EXCLUDED.prize_index, prize_label = EXCLUDED.prize_label, prize_amount = EXCLUDED.prize_amount;
  notification_body := 'You won ' || prize_label || ' on the wheel. It has been added to your balance.';
  notification_data := jsonb_build_object('amount', prize_row.amount, 'currency', 'MMK',
    'balance', balance_after, 'rewardId', reward_id, 'route', 'notifications');
  INSERT INTO public.app_notifications (recipient_username, event_type, title, body, data, source_table, source_id)
  VALUES (user_row.username, 'wheel_reward', 'Wheel reward', notification_body,
    notification_data, 'wheel_spin_rewards', reward_id::text)
  RETURNING id INTO notification_id;
  RETURN jsonb_build_object('status', 'success', 'prizeIndex', p_prize_index,
    'prize', prize_label, 'amount', prize_row.amount, 'balance', balance_after,
    'minimumBalance', 100000, 'eligible', true, 'canSpin', false,
    'nextSpinAt', spin_time + interval '24 hours', 'rewardId', reward_id,
    'notification', jsonb_build_object('id', notification_id, 'username', user_row.username,
      'title', 'Wheel reward', 'body', notification_body, 'data', notification_data));
END;
$function$;

REVOKE ALL ON FUNCTION public.read_wheel_configuration() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.replace_wheel_configuration(integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.spin_wheel_atomic(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_wheel_configuration() TO service_role;
GRANT EXECUTE ON FUNCTION public.replace_wheel_configuration(integer, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.spin_wheel_atomic(uuid, integer, integer) TO service_role;

COMMIT;
