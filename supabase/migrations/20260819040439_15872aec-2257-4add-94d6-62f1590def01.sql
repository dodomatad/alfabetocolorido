ALTER TABLE public.entregas 
ADD COLUMN IF NOT EXISTS custo_reposicao NUMERIC(10,2) DEFAULT 0.00;

-- Recarregar cache de schema
NOTIFY pgrst, 'reload schema';