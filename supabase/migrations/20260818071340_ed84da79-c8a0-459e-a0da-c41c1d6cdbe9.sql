-- 1. Criar tabela de convites de equipe
CREATE TABLE IF NOT EXISTS public.convites_equipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    email TEXT,
    cargo TEXT NOT NULL DEFAULT 'Operador',
    papel TEXT NOT NULL DEFAULT 'funcionario',
    permissoes JSONB NOT NULL DEFAULT '{"dashboard": {"pode_visualizar": true, "ocultar_valores": true}, "producao": {"pode_visualizar": true, "pode_criar": true}}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'aceito', 'expirado'
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- 2. Habilitar RLS
ALTER TABLE public.convites_equipe ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
-- Permitir que administradores e gestores gerenciem convites de sua empresa
CREATE POLICY "Gerenciar convites da empresa"
ON public.convites_equipe
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'gestor')
)
WITH CHECK (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'gestor')
);

-- Permitir leitura pública/anônima de convite via token para validação na tela de registro
CREATE POLICY "Leitura de convite por token"
ON public.convites_equipe
FOR SELECT
TO anon, authenticated
USING (status = 'pendente' AND expires_at > now());

-- 4. Permissões de acesso (Grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites_equipe TO authenticated;
GRANT SELECT ON public.convites_equipe TO anon;
GRANT ALL ON public.convites_equipe TO service_role;
