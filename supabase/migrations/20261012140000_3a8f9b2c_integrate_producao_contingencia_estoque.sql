-- Migration: 20261012140000_3a8f9b2c_integrate_producao_contingencia_estoque.sql

-- 1. Adicionar colunas de rastreabilidade (origem, producao_id, contingencia_id) na tabela estoque
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'origem') THEN
        ALTER TABLE public.estoque ADD COLUMN origem TEXT DEFAULT 'manual';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'producao_id') THEN
        ALTER TABLE public.estoque ADD COLUMN producao_id UUID REFERENCES public.producao_diaria(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'contingencia_id') THEN
        ALTER TABLE public.estoque ADD COLUMN contingencia_id UUID;
    END IF;
END $$;

-- 2. Índices de performance
CREATE INDEX IF NOT EXISTS idx_estoque_origem ON public.estoque(empresa_id, origem);
CREATE INDEX IF NOT EXISTS idx_estoque_producao_id ON public.estoque(producao_id);

-- 3. Notificar PostgREST
NOTIFY pgrst, 'reload schema';
