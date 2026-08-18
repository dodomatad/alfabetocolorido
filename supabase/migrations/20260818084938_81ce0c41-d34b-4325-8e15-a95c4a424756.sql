
-- 1. Unificar a lógica de papéis na usuarios_papeis
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        INSERT INTO public.usuarios_papeis (usuario_id, papel)
        SELECT user_id, role::text::app_role FROM public.user_roles
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 2. Remover a tabela duplicada
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 3. Atualizar a função has_role oficial SEM DROPAR (usar CREATE OR REPLACE)
-- Isso preserva as dependências de RLS existentes.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios_papeis 
    WHERE usuario_id = _user_id 
      AND papel::text = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios_papeis 
    WHERE usuario_id = _user_id 
      AND papel = _role
  );
$$;

-- 4. Corrigir o onboarding
CREATE OR REPLACE FUNCTION public.onboarding_novo_usuario(_nome_usuario text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

    -- Criar perfil
    INSERT INTO public.perfis (id, nome, empresa_id)
    VALUES (v_usuario_id, _nome_usuario, v_empresa_id)
    ON CONFLICT (id) DO UPDATE SET empresa_id = v_empresa_id, nome = _nome_usuario;

    -- Atribuir papel de administrador
    INSERT INTO public.usuarios_papeis (usuario_id, papel, empresa_id)
    VALUES (v_usuario_id, 'administrador', v_empresa_id)
    ON CONFLICT (usuario_id, papel) DO UPDATE SET empresa_id = v_empresa_id;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$function$;

-- 5. Garantir permissões
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(text) TO authenticated;
GRANT ALL ON public.usuarios_papeis TO authenticated;
GRANT ALL ON public.perfis TO authenticated;
GRANT ALL ON public.empresas TO authenticated;
GRANT ALL ON public.usuarios_papeis TO service_role;
GRANT ALL ON public.perfis TO service_role;
GRANT ALL ON public.empresas TO service_role;
