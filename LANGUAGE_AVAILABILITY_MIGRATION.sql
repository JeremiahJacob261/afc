-- Keep push-token language values aligned with the active application locales.
BEGIN;

UPDATE public.push_tokens
SET language = 'en'
WHERE language IS NULL
   OR language NOT IN ('en', 'fr', 'es', 'it', 'ru');

ALTER TABLE public.push_tokens
  DROP CONSTRAINT IF EXISTS push_tokens_language_check;

ALTER TABLE public.push_tokens
  ADD CONSTRAINT push_tokens_language_check
  CHECK (language IN ('en', 'fr', 'es', 'it', 'ru'));

COMMIT;
