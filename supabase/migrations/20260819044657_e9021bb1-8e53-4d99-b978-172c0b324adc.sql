ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS cliente TEXT;
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendas' AND column_name = 'cliente_nome'
    ) THEN 
        UPDATE public.vendas SET cliente = cliente_nome WHERE cliente IS NULL; 
    END IF; 
END $$;
NOTIFY pgrst, 'reload schema';