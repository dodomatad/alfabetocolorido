-- Adiciona novos papéis se necessário (já existem administrador, gestor, financeiro, supervisor_producao, funcionario, visualizacao)

-- Tabela de Permissões Granulares por Papel ou Usuário
CREATE TABLE public.permissoes_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  papel public.app_role,
  modulo text NOT NULL, -- 'dashboard', 'producao', 'financeiro', etc.
  permissao text NOT NULL, -- 'visualizar_faturamento', 'editar_producao', etc.
  permitido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, usuario_id, papel, modulo, permissao),
  CONSTRAINT user_or_role CHECK ((usuario_id IS NOT NULL AND papel IS NULL) OR (usuario_id IS NULL AND papel IS NOT NULL))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissoes_acesso TO authenticated;
GRANT ALL ON public.permissoes_acesso TO service_role;
ALTER TABLE public.permissoes_acesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissoes_leitura" ON public.permissoes_acesso FOR SELECT TO authenticated 
  USING (empresa_id = public.empresa_atual());

CREATE POLICY "permissoes_admin" ON public.permissoes_acesso FOR ALL TO authenticated 
  USING (empresa_id = public.empresa_atual() AND public.has_role(auth.uid(), 'administrador'));

-- Função para verificar permissão granular
CREATE OR REPLACE FUNCTION public.tem_permissao(_modulo text, _permissao text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_empresa uuid;
  v_permitido boolean;
BEGIN
  v_empresa := public.empresa_atual();
  
  -- Se for admin, tem tudo por padrão
  IF public.has_role(v_user, 'administrador') THEN RETURN true; END IF;

  -- 1. Verifica permissão específica do usuário
  SELECT permitido INTO v_permitido FROM public.permissoes_acesso 
  WHERE empresa_id = v_empresa AND usuario_id = v_user AND modulo = _modulo AND permissao = _permissao;
  
  IF v_permitido IS NOT NULL THEN RETURN v_permitido; END IF;

  -- 2. Verifica permissão do papel do usuário
  SELECT EXISTS (
    SELECT 1 FROM public.permissoes_acesso p
    JOIN public.usuarios_papeis up ON up.papel = p.papel
    WHERE p.empresa_id = v_empresa AND up.usuario_id = v_user AND p.modulo = _modulo AND p.permissao = _permissao AND p.permitido = true
  ) INTO v_permitido;

  RETURN v_permitido;
END; $$;

