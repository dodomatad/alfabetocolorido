-- 1. Função para listar acessos pendentes
CREATE OR REPLACE FUNCTION public.listar_acessos_pendentes()
RETURNS TABLE (
    user_id UUID,
    nome TEXT,
    email TEXT,
    convite_id UUID,
    cargo_sugerido TEXT,
    papel_sugerido app_role,
    permissoes_sugeridas JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _empresa_id UUID;
BEGIN
    -- Pegar empresa do usuário logado
    SELECT empresa_id INTO _empresa_id FROM public.perfis WHERE id = auth.uid();
    
    IF _empresa_id IS NULL THEN
        RETURN;
    END IF;

    -- Validar se quem chama é admin ou gestor
    IF NOT public.has_role(auth.uid(), 'administrador') AND NOT public.has_role(auth.uid(), 'gestor') THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    WITH pendentes_convite AS (
        -- Casos com convite pendente mas usuário já criou conta auth
        SELECT 
            u.id as user_id,
            COALESCE(u.raw_user_meta_data->>'nome', split_part(u.email::text, '@', 1)) as nome,
            u.email::text,
            c.id as convite_id,
            c.cargo as cargo_sugerido,
            c.papel as papel_sugerido,
            (
                SELECT jsonb_object_agg(modulo, jsonb_build_object(
                    'visualiza', pode_visualizar,
                    'edita', pode_editar,
                    'exclui', pode_excluir,
                    'ocultar', ocultar_valores
                ))
                FROM public.permissoes_acesso_convite
                WHERE convite_id = c.id
            ) as permissoes_sugeridas,
            u.created_at
        FROM auth.users u
        JOIN public.convites_equipe c ON c.email = u.email
        LEFT JOIN public.perfis p ON p.id = u.id
        WHERE c.empresa_id = _empresa_id
          AND c.status = 'pendente'
          AND c.expires_at > now()
          AND (p.id IS NULL OR p.empresa_id IS NULL OR p.empresa_id != _empresa_id)
    ),
    pendentes_orfaos AS (
        -- Casos onde o usuário tem conta mas o perfil está sem empresa (ex: erro no onboarding)
        SELECT 
            u.id as user_id,
            COALESCE(u.raw_user_meta_data->>'nome', split_part(u.email::text, '@', 1)) as nome,
            u.email::text,
            NULL::UUID as convite_id,
            NULL::TEXT as cargo_sugerido,
            'funcionario'::app_role as papel_sugerido,
            NULL::JSONB as permissoes_sugeridas,
            u.created_at
        FROM auth.users u
        JOIN public.perfis p ON p.id = u.id
        WHERE p.empresa_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM pendentes_convite pc WHERE pc.user_id = u.id)
    )
    SELECT * FROM pendentes_convite
    UNION ALL
    SELECT * FROM pendentes_orfaos;
END;
$$;

GRANT EXECUTE ON FUNCTION public.listar_acessos_pendentes() TO authenticated;

-- Garantir que a tabela convites_equipe tem os campos necessários
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'convites_equipe' AND column_name = 'usado_por') THEN
        ALTER TABLE public.convites_equipe ADD COLUMN usado_por UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Função auxiliar para marcar o convite como usado
CREATE OR REPLACE FUNCTION public.marcar_convite_usado(_convite_id UUID, _user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.convites_equipe
    SET status = 'aceito',
        usado_por = _user_id,
        updated_at = now()
    WHERE id = _convite_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_convite_usado(UUID, UUID) TO service_role;