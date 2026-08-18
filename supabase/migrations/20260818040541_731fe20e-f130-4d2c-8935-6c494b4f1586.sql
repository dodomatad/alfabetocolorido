-- Revogar acesso público (anon) das funções SECURITY DEFINER criadas
-- O linter avisa que funções SECURITY DEFINER no schema public são executáveis por anon por padrão.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pode_gerenciar() FROM PUBLIC, anon;

-- Garantir que apenas authenticated e service_role possam executar
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO authenticated, service_role;
