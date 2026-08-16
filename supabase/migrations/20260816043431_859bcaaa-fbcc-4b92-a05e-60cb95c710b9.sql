-- Revogar acesso público geral das funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tem_permissao(uuid, public.modulo_sistema, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.empresa_atual() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pode_gerenciar() FROM PUBLIC;

-- Conceder acesso apenas a usuários autenticados e service_role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tem_permissao(uuid, public.modulo_sistema, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.empresa_atual() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO authenticated, service_role;
