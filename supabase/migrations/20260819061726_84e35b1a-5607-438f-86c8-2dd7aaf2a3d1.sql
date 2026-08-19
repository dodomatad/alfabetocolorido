-- Reforço de Segurança (Item 9) com assinaturas corrigidas

-- 1. has_role (Polimorfismo: Texto e Enum)
ALTER FUNCTION public.has_role(uuid, text) SET search_path = public;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 2. check_permission (Polimorfismo)
ALTER FUNCTION public.check_permission(uuid, text, text) SET search_path = public;
REVOKE ALL ON FUNCTION public.check_permission(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_permission(uuid, text, text) TO authenticated, service_role;

ALTER FUNCTION public.check_permission(uuid, modulo_sistema, text) SET search_path = public;
REVOKE ALL ON FUNCTION public.check_permission(uuid, modulo_sistema, text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_permission(uuid, modulo_sistema, text) TO authenticated, service_role;

-- 3. onboarding_novo_usuario
ALTER FUNCTION public.onboarding_novo_usuario(text) SET search_path = public;
REVOKE ALL ON FUNCTION public.onboarding_novo_usuario(text) FROM public;
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(text) TO service_role;

-- 4. pode_gerenciar (Sem argumentos no cache)
ALTER FUNCTION public.pode_gerenciar() SET search_path = public;
REVOKE ALL ON FUNCTION public.pode_gerenciar() FROM public;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO authenticated, service_role;

-- 5. proximo_numero_venda
ALTER FUNCTION public.proximo_numero_venda() SET search_path = public;
REVOKE ALL ON FUNCTION public.proximo_numero_venda() FROM public;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda() TO authenticated, service_role;

ALTER FUNCTION public.proximo_numero_venda(text) SET search_path = public;
REVOKE ALL ON FUNCTION public.proximo_numero_venda(text) FROM public;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(text) TO authenticated, service_role;
