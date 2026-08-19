-- 1. Criar tabela de reposições (nova estrutura solicitada)
CREATE TABLE IF NOT EXISTS public.reposicoes_perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL DEFAULT internal.empresa_atual(),
    venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
    cliente_nome TEXT NOT NULL,
    tipo_perfil TEXT NOT NULL, -- Ex: 'BM Ilimitada', 'Perfil Restabelecido', 'Conta Simples'
    motivo_reposicao TEXT NOT NULL, -- Ex: 'Checkpoint no 1º login', 'Queda de BM', 'Proxy inválido'
    custo_reposicao NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Custo do novo perfil gasto para repor
    responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'concluida', -- 'pendente', 'em_analise', 'concluida'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.reposicoes_perfis ENABLE ROW LEVEL SECURITY;

-- 3. Garantir acessos (necessário para o Supabase Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reposicoes_perfis TO authenticated;
GRANT ALL ON public.reposicoes_perfis TO service_role;

-- 4. Criar políticas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reposicoes_perfis' AND policyname = 'Gerenciar reposicoes para autenticados da mesma empresa') THEN
        CREATE POLICY "Gerenciar reposicoes para autenticados da mesma empresa"
        ON public.reposicoes_perfis
        FOR ALL
        TO authenticated
        USING (empresa_id = internal.empresa_atual())
        WITH CHECK (empresa_id = internal.empresa_atual());
    END IF;
END $$;

-- 5. Atualizar esquema
NOTIFY pgrst, 'reload schema';
