-- 1. Fortalecer as funções existentes mantendo as assinaturas para não quebrar políticas
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$ 
BEGIN 
    RETURN EXISTS (
        SELECT 1 
        FROM public.usuarios_papeis 
        WHERE usuario_id = _user_id 
          AND papel::TEXT ILIKE _role
    ); 
END; 
$$;

CREATE OR REPLACE FUNCTION internal.empresa_atual()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, internal, pg_temp
AS $$ 
DECLARE 
    _emp_id UUID; 
BEGIN 
    SELECT empresa_id 
    INTO _emp_id 
    FROM public.perfis 
    WHERE id = auth.uid() 
    LIMIT 1; 
    
    RETURN COALESCE(_emp_id, '00000000-0000-0000-0000-000000000000'::UUID); 
END; 
$$;

CREATE OR REPLACE FUNCTION internal.pode_gerenciar()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, internal, pg_temp
AS $$ 
BEGIN 
    RETURN public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'gestor'); 
END; 
$$;

CREATE OR REPLACE FUNCTION public.check_permission(_user_id UUID, _modulo TEXT, _acao TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, internal, pg_temp
AS $$
BEGIN
    IF public.has_role(_user_id, 'administrador') THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.permissoes_acesso
        WHERE usuario_id = _user_id
          AND modulo = _modulo
          AND (
            (_acao = 'visualizar' AND pode_visualizar = TRUE) OR
            (_acao = 'criar' AND pode_criar = TRUE) OR
            (_acao = 'editar' AND pode_editar = TRUE) OR
            (_acao = 'excluir' AND pode_excluir = TRUE)
          )
    );
END;
$$;

-- 2. Onboarding Atômico (Limpando antes para mudar retorno)
DROP FUNCTION IF EXISTS public.onboarding_novo_usuario(TEXT);
CREATE OR REPLACE FUNCTION public.onboarding_novo_usuario(_nome_usuario TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$
DECLARE
    _user_id UUID := auth.uid();
    _empresa_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM public.perfis WHERE id = _user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Perfil já existente');
    END IF;

    INSERT INTO public.empresas (razao_social, nome_fantasia)
    VALUES ('Minha Empresa', _nome_usuario || ' - Empresa')
    RETURNING id INTO _empresa_id;

    INSERT INTO public.perfis (id, empresa_id, nome, email, ativo)
    VALUES (_user_id, _empresa_id, _nome_usuario, (SELECT email FROM auth.users WHERE id = _user_id), TRUE);

    INSERT INTO public.usuarios_papeis (usuario_id, empresa_id, papel)
    VALUES (_user_id, _empresa_id, 'administrador');

    INSERT INTO public.permissoes_acesso (usuario_id, empresa_id, modulo, pode_visualizar, pode_criar, pode_editar, pode_excluir, ocultar_valores)
    SELECT _user_id, _empresa_id, m, TRUE, TRUE, TRUE, TRUE, FALSE
    FROM unnest(ARRAY['dashboard', 'vendas', 'producao', 'estoque', 'entregas', 'financeiro', 'clientes', 'fornecedores', 'equipe', 'relatorios', 'configuracoes']) AS m;

    RETURN jsonb_build_object(
        'success', true, 
        'empresa_id', _empresa_id,
        'message', 'Onboarding concluído com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Grants
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.empresa_atual() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.pode_gerenciar() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_permission(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) TO authenticated;

-- 4. Políticas de RLS de Isolamento Absoluto
-- Perfis
DROP POLICY IF EXISTS "Perfis são isolados por empresa" ON public.perfis;
CREATE POLICY "Perfis são isolados por empresa" ON public.perfis
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual() OR id = auth.uid());

-- Empresas
DROP POLICY IF EXISTS "Empresas são isoladas" ON public.empresas;
CREATE POLICY "Empresas são isoladas" ON public.empresas
    FOR ALL TO authenticated USING (id = internal.empresa_atual());

-- Clientes
DROP POLICY IF EXISTS "clientes_isolamento" ON public.clientes;
CREATE POLICY "clientes_isolamento" ON public.clientes
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual());

-- Vendas
DROP POLICY IF EXISTS "vendas_isolamento" ON public.vendas;
CREATE POLICY "vendas_isolamento" ON public.vendas
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual());

-- Venda Itens (Via join com vendas para isolamento)
DROP POLICY IF EXISTS "venda_itens_isolamento" ON public.venda_itens;
CREATE POLICY "venda_itens_isolamento" ON public.venda_itens
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.empresa_id = internal.empresa_atual()));

-- Usuarios Papeis
DROP POLICY IF EXISTS "usuarios_papeis_isolamento" ON public.usuarios_papeis;
CREATE POLICY "usuarios_papeis_isolamento" ON public.usuarios_papeis
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual());

-- Permissões
DROP POLICY IF EXISTS "permissoes_acesso_isolamento" ON public.permissoes_acesso;
CREATE POLICY "permissoes_acesso_isolamento" ON public.permissoes_acesso
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual());

-- Produção Diária
DROP POLICY IF EXISTS "producao_diaria_isolamento" ON public.producao_diaria;
CREATE POLICY "producao_diaria_isolamento" ON public.producao_diaria
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual());
