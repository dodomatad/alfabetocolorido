-- Enum para módulos do sistema
DO $$ BEGIN
    CREATE TYPE public.modulo_sistema AS ENUM (
        'dashboard',
        'vendas',
        'producao',
        'estoque',
        'entregas',
        'financeiro',
        'clientes',
        'fornecedores',
        'equipe',
        'configuracoes'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de permissões granulares
CREATE TABLE IF NOT EXISTS public.permissoes_acesso (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modulo public.modulo_sistema NOT NULL,
    pode_visualizar boolean DEFAULT true,
    pode_criar boolean DEFAULT false,
    pode_editar boolean DEFAULT false,
    pode_excluir boolean DEFAULT false,
    ocultar_valores boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(usuario_id, modulo)
);

-- Habilitar RLS
ALTER TABLE public.permissoes_acesso ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissoes_acesso TO authenticated;
GRANT ALL ON public.permissoes_acesso TO service_role;

-- Políticas de RLS
DROP POLICY IF EXISTS "Usuários podem ver suas próprias permissões" ON public.permissoes_acesso;
CREATE POLICY "Usuários podem ver suas próprias permissões"
ON public.permissoes_acesso FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Administradores podem gerenciar permissões da empresa" ON public.permissoes_acesso;
CREATE POLICY "Administradores podem gerenciar permissões da empresa"
ON public.permissoes_acesso FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

-- Função para verificar permissão granular
CREATE OR REPLACE FUNCTION public.tem_permissao(_usuario_id uuid, _modulo public.modulo_sistema, _tipo text DEFAULT 'visualizar')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _admin boolean;
    _pPode boolean;
BEGIN
    -- Admins sempre têm acesso total
    SELECT public.has_role(_usuario_id, 'administrador') INTO _admin;
    IF _admin THEN
        RETURN true;
    END IF;

    -- Verificar tabela de permissões
    CASE _tipo
        WHEN 'criar' THEN
            SELECT pode_criar INTO _pPode FROM public.permissoes_acesso WHERE usuario_id = _usuario_id AND modulo = _modulo;
        WHEN 'editar' THEN
            SELECT pode_editar INTO _pPode FROM public.permissoes_acesso WHERE usuario_id = _usuario_id AND modulo = _modulo;
        WHEN 'excluir' THEN
            SELECT pode_excluir INTO _pPode FROM public.permissoes_acesso WHERE usuario_id = _usuario_id AND modulo = _modulo;
        ELSE
            SELECT pode_visualizar INTO _pPode FROM public.permissoes_acesso WHERE usuario_id = _usuario_id AND modulo = _modulo;
    END CASE;

    RETURN COALESCE(_pPode, false);
END;
$$;

-- Logs de Acesso
CREATE TABLE IF NOT EXISTS public.logs_acesso (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.logs_acesso TO authenticated;
GRANT ALL ON public.logs_acesso TO service_role;

DROP POLICY IF EXISTS "Admins podem ver logs da empresa" ON public.logs_acesso;
CREATE POLICY "Admins podem ver logs da empresa"
ON public.logs_acesso FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));
