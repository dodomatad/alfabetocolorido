
-- Função para checar permissão específica de forma segura
CREATE OR REPLACE FUNCTION public.check_permission(_user_id uuid, _modulo public.modulo_sistema, _acao text DEFAULT 'visualizar')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.permissoes_acesso
    WHERE usuario_id = _user_id
      AND modulo = _modulo
      AND (
        (_acao = 'visualizar' AND pode_visualizar = true) OR
        (_acao = 'criar' AND pode_criar = true) OR
        (_acao = 'editar' AND pode_editar = true) OR
        (_acao = 'excluir' AND pode_excluir = true)
      )
  ) OR public.has_role(_user_id, 'administrador');
$$;

-- RLS para logs_acesso
ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver logs da sua empresa se tiverem permissão" ON public.logs_acesso;
CREATE POLICY "Usuários podem ver logs da sua empresa se tiverem permissão"
ON public.logs_acesso
FOR SELECT
TO authenticated
USING (
  empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  AND public.check_permission(auth.uid(), 'equipe', 'visualizar')
);

-- RLS para lancamentos_financeiros
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver financeiro se tiverem permissão" ON public.lancamentos_financeiros;
CREATE POLICY "Usuários podem ver financeiro se tiverem permissão"
ON public.lancamentos_financeiros
FOR SELECT
TO authenticated
USING (
  empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  AND public.check_permission(auth.uid(), 'financeiro', 'visualizar')
);

-- RLS para producao_diaria
ALTER TABLE public.producao_diaria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver producao se tiverem permissão" ON public.producao_diaria;
CREATE POLICY "Usuários podem ver producao se tiverem permissão"
ON public.producao_diaria
FOR SELECT
TO authenticated
USING (
  empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  AND public.check_permission(auth.uid(), 'producao', 'visualizar')
);

-- Grant permissão para a nova função
GRANT EXECUTE ON FUNCTION public.check_permission(uuid, public.modulo_sistema, text) TO authenticated;
