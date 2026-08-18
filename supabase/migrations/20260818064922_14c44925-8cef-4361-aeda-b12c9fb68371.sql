ALTER TYPE public.venda_status ADD VALUE IF NOT EXISTS 'reembolsada' AFTER 'cancelada';
NOTIFY pgrst, 'reload schema';