-- Adicionar colunas operacionais de BM na tabela producao_diaria
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'nome_bm') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN nome_bm TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'limite_bm') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN limite_bm TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'tem_template') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN tem_template BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'data_criacao') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN data_criacao DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'destinatario') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN destinatario TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'status_envio') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN status_envio TEXT DEFAULT 'disponivel';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'quantidade') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN quantidade INTEGER DEFAULT 1;
    END IF;
END $$;

-- Recarregar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
