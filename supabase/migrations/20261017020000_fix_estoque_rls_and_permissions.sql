-- Migration para corrigir RLS e permissões na tabela estoque
-- 1. Garantir permissões de acesso às roles da API
GRANT ALL ON TABLE public.estoque TO authenticated;
GRANT ALL ON TABLE public.estoque TO anon;
GRANT ALL ON TABLE public.estoque TO service_role;

-- Conceder permissões em sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 2. Habilitar RLS e configurar políticas abertas para inserção e consulta
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

-- Garantir coluna user_id opcional na tabela estoque
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS user_id UUID;

-- Remover políticas antigas restritivas
DROP POLICY IF EXISTS "Permitir leitura de estoque" ON public.estoque;
DROP POLICY IF EXISTS "Permitir insercao de estoque" ON public.estoque;
DROP POLICY IF EXISTS "Permitir update de estoque" ON public.estoque;
DROP POLICY IF EXISTS "Permitir delete de estoque" ON public.estoque;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.estoque;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.estoque;
DROP POLICY IF EXISTS "Gerenciar estoque para autenticados da mesma empresa" ON public.estoque;
DROP POLICY IF EXISTS "Permitir acesso total ao estoque" ON public.estoque;

-- Criar política permissiva para todas as operações
CREATE POLICY "Permitir acesso total ao estoque" 
ON public.estoque 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Caso exista a tabela bm_inventory, aplicar as mesmas permissões e políticas
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bm_inventory') THEN
    GRANT ALL ON TABLE public.bm_inventory TO authenticated;
    GRANT ALL ON TABLE public.bm_inventory TO anon;
    GRANT ALL ON TABLE public.bm_inventory TO service_role;
    ALTER TABLE public.bm_inventory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Permitir acesso total ao bm_inventory" ON public.bm_inventory;
    CREATE POLICY "Permitir acesso total ao bm_inventory" ON public.bm_inventory FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Recarregar cache de schema e permissões do PostgREST
NOTIFY pgrst, 'reload schema';
