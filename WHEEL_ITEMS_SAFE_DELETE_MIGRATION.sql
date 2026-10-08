-- The hosted database requires a WHERE clause for DELETE statements.
CREATE OR REPLACE FUNCTION public.replace_wheel_configuration(p_expected_revision integer, p_items jsonb)
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

  DELETE FROM public.wheel_items WHERE position >= 0;
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
