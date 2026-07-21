-- Run this in Supabase before deploying the withdrawal availability controls.
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS withdrawals_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS withdrawal_disabled_message TEXT NOT NULL DEFAULT 'Withdrawals are temporarily unavailable. Please try again later.';

INSERT INTO public.admin_settings (id, withdrawals_enabled, withdrawal_disabled_message)
VALUES (1, TRUE, 'Withdrawals are temporarily unavailable. Please try again later.')
ON CONFLICT (id) DO NOTHING;
