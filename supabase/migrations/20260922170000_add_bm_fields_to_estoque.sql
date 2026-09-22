-- 1. Adicionar colunas operacionais para controle de Ativos BM na tabela estoque
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'nome_bm') THEN
        ALTER TABLE public.estoque ADD COLUMN nome_bm TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'limite_bm') THEN
        ALTER TABLE public.estoque ADD COLUMN limite_bm TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'tem_template') THEN
        ALTER TABLE public.estoque ADD COLUMN tem_template BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'data_criacao') THEN
        ALTER TABLE public.estoque ADD COLUMN data_criacao DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'responsavel') THEN
        ALTER TABLE public.estoque ADD COLUMN responsavel TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'destinatario') THEN
        ALTER TABLE public.estoque ADD COLUMN destinatario TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'status_envio') THEN
        ALTER TABLE public.estoque ADD COLUMN status_envio TEXT DEFAULT 'disponivel';
    END IF;
END $$;

-- 2. Remover a restrição de unicidade (empresa_id, tipo_ativo) para permitir múltiplas BMs individuais
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS uq_estoque_empresa_tipo;

-- 3. Recarregar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
