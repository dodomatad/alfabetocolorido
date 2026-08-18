
-- 1. Criar a tabela equipe_membros no schema public
CREATE TABLE IF NOT EXISTS public.equipe_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    cargo TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'funcionario',
    permissoes JSONB DEFAULT '{"visao_geral": true, "producao": true, "vendas": true, "financeiro": true, "estoque": true, "entregas": true, "equipe": true, "relatorios": true, "configuracoes": true, "ocultar_financeiro": false}'::jsonb,
    status TEXT NOT NULL DEFAULT 'ativo',
    status_senha TEXT NOT NULL DEFAULT 'Senha Ativa',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir que não haja duplicatas de email na mesma empresa
CREATE UNIQUE INDEX IF NOT EXISTS equipe_membros_empresa_email_idx ON public.equipe_membros (empresa_id, email);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;

-- 3. Conceder permissões de API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipe_membros TO authenticated;
GRANT ALL ON public.equipe_membros TO service_role;

-- 4. Criar políticas de segurança baseadas em empresa_id
CREATE POLICY "Membros podem ver outros membros da mesma empresa"
ON public.equipe_membros
FOR SELECT
TO authenticated
USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Admins podem gerenciar equipe da empresa"
ON public.equipe_membros
FOR ALL
TO authenticated
USING (
  empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- 5. Forçar o recarregamento do cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
