-- Admin-managed wheel artwork and labels. Spins remain visual only.
CREATE TABLE public.wheel_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0)
);
INSERT INTO public.wheel_settings (id, revision) VALUES (1, 1);

CREATE TABLE public.wheel_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position smallint NOT NULL CHECK (position BETWEEN 0 AND 11),
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 32),
  image_url text NOT NULL DEFAULT '',
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX wheel_items_position_key ON public.wheel_items (position);

INSERT INTO public.wheel_items (position, label, image_url, color) VALUES
  (0, 'iPhone 17', '/assets/wheel/phone.png', '#d047dc'),
  (1, 'K5,000', '/assets/wheel/gift.png', '#a840d6'),
  (2, 'K20,000', '/assets/wheel/gift.png', '#1daedc'),
  (3, 'K100,000', '/assets/wheel/gift.png', '#f235a0'),
  (4, 'K10', '/assets/wheel/gift.png', '#29dc45'),
  (5, 'K500', '/assets/wheel/gift.png', '#ffe700'),
  (6, 'K1,000', '/assets/wheel/gift.png', '#eb7608'),
  (7, 'K30,000', '/assets/wheel/gift.png', '#ef5f9d');

ALTER TABLE public.wheel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheel_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wheel_settings, public.wheel_items FROM anon, authenticated;

ALTER TABLE public.wheel_spin_state ADD COLUMN prize_label text;
UPDATE public.wheel_spin_state
SET prize_label = (ARRAY['iPhone 17','K5,000','K20,000','K100,000','K10','K500','K1,000','K30,000'])[prize_index + 1]
WHERE prize_label IS NULL;
ALTER TABLE public.wheel_spin_state DROP CONSTRAINT wheel_spin_state_prize_index_check;
ALTER TABLE public.wheel_spin_state ADD CONSTRAINT wheel_spin_state_prize_index_check
  CHECK (prize_index BETWEEN 0 AND 11);

CREATE FUNCTION public.read_wheel_configuration()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $function$
  SELECT jsonb_build_object(
    'revision', settings.revision,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', item.id,
        'label', item.label,
        'imageUrl', item.image_url,
        'color', item.color
      ) ORDER BY item.position)
      FROM public.wheel_items item
    ), '[]'::jsonb)
  )
  FROM public.wheel_settings settings WHERE settings.id = 1;
$function$;

CREATE FUNCTION public.replace_wheel_configuration(p_expected_revision integer, p_items jsonb)
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  current_revision integer;
  item jsonb;
  ordinal bigint;
  item_label text;
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

  DELETE FROM public.wheel_items;
  FOR item, ordinal IN SELECT value, ordinality FROM jsonb_array_elements(p_items) WITH ORDINALITY LOOP
    item_label := btrim(COALESCE(item->>'label', ''));
    item_image := btrim(COALESCE(item->>'imageUrl', ''));
    item_color := COALESCE(item->>'color', '');
    IF char_length(item_label) NOT BETWEEN 1 AND 32
       OR char_length(item_image) > 2048
       OR (item_image <> '' AND item_image !~ '^(/[^/]|https://)')
       OR item_color !~ '^#[0-9A-Fa-f]{6}$' THEN
      RAISE EXCEPTION 'Invalid wheel item at position %', ordinal;
    END IF;
    INSERT INTO public.wheel_items (id, position, label, image_url, color)
    VALUES (COALESCE(NULLIF(item->>'id', '')::uuid, gen_random_uuid()), ordinal - 1, item_label, item_image, item_color);
  END LOOP;
  UPDATE public.wheel_settings SET revision = revision + 1 WHERE id = 1 RETURNING revision INTO current_revision;
  RETURN current_revision;
END;
$function$;

REVOKE ALL ON FUNCTION public.read_wheel_configuration() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.replace_wheel_configuration(integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_wheel_configuration() TO service_role;
GRANT EXECUTE ON FUNCTION public.replace_wheel_configuration(integer, jsonb) TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('wheel-prizes', 'wheel-prizes', true)
ON CONFLICT (id) DO NOTHING;
