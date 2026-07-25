-- Editable community and support links shared by the website and mobile app.
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS telegram_group_url TEXT NOT NULL DEFAULT 'https://t.me/+Giav1o1JVGNkYzNk',
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/I1D6NNWndu6HDrbzB5BkPX?s=hd&p=i&mlu=0&ilr=0',
  ADD COLUMN IF NOT EXISTS customer_support_url TEXT NOT NULL DEFAULT 'https://t.me/EFC_Support';
