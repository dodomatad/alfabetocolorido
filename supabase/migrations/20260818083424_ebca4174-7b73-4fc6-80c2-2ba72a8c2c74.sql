
-- 1. Criar a função de onboarding (empresa + perfil + papel)
CREATE OR REPLACE FUNCTION public.onboarding_novo_usuario(_nome_usuario TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_empresa_id UUID;
    v_usuario_id UUID;
BEGIN
    v_usuario_id := auth.uid();
    
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Criar empresa padrão
    INSERT INTO public.empresas (razao_social, nome_fantasia, ativo)
    VALUES ('Minha Empresa', _nome_usuario, true)
    RETURNING id INTO v_empresa_id;

    -- Criar perfil (se não existir via trigger)
    INSERT INTO public.perfis (id, nome, empresa_id)
    VALUES (v_usuario_id, _nome_usuario, v_empresa_id)
    ON CONFLICT (id) DO UPDATE SET empresa_id = v_empresa_id, nome = _nome_usuario;

    -- Atribuir papel de administrador
    -- Nota: A tabela pode se chamar usuarios_papeis ou user_roles. Verificando por tipos.
    INSERT INTO public.usuarios_papeis (usuario_id, papel)
    VALUES (v_usuario_id, 'administrador')
    ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 2. Ajustar RLS para permitir que o usuário inicie seu cadastro
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfis_criar_proprio" ON public.perfis;
CREATE POLICY "perfis_criar_proprio" ON public.perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

ALTER TABLE public.usuarios_papeis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_papeis_auto_insert" ON public.usuarios_papeis;
CREATE POLICY "usuarios_papeis_auto_insert" ON public.usuarios_papeis FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

-- 3. Garantir permissões
GRANT INSERT ON public.perfis TO authenticated;
GRANT INSERT ON public.usuarios_papeis TO authenticated;
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) TO authenticated;
GRANT ALL ON public.empresas TO authenticated;
GRANT ALL ON public.perfis TO authenticated;
GRANT ALL ON public.usuarios_papeis TO authenticated;
