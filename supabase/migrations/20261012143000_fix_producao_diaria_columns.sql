-- Garantir que producao_diaria suporte data_criacao caso consultado e recarregar schema cache do PostgREST
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'data_criacao') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN data_criacao DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
