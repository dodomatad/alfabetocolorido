-- 1. Atualizar funções existentes para usar um search_path mais seguro (incluindo pg_temp)
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_permission(uuid, modulo_sistema, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.pode_gerenciar() SET search_path = public, pg_temp;
ALTER FUNCTION public.proximo_numero_venda(text) SET search_path = public, pg_temp;

-- 2. Revogar execução pública/anon de funções sensíveis para seguir o princípio do menor privilégio,
-- garantindo que apenas roles autorizadas (authenticated, service_role) possam executá-las conforme necessário.
-- O aviso crítico da Lovable frequentemente se refere a funções SECURITY DEFINER expostas indevidamente a 'anon'.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.check_permission(uuid, modulo_sistema, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.pode_gerenciar() FROM public, anon;

-- Nota: proximo_numero_venda pode precisar de acesso para criação de vendas, mas idealmente apenas por usuários autenticados.
REVOKE EXECUTE ON FUNCTION public.proximo_numero_venda(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(text) TO authenticated, service_role;

-- Garantir que roles autenticadas ainda tenham acesso onde necessário
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_permission(uuid, modulo_sistema, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO authenticated, service_role;

-- 3. Notificar recarregamento do cache
NOTIFY pgrst, 'reload schema';