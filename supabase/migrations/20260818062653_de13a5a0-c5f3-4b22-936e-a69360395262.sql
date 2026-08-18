
-- Corrigindo linter: Revogando EXECUTE público e restringindo a authenticated
REVOKE EXECUTE ON FUNCTION public.check_permission(uuid, public.modulo_sistema, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_permission(uuid, public.modulo_sistema, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_permission(uuid, public.modulo_sistema, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_permission(uuid, public.modulo_sistema, text) TO service_role;

-- Mesma correção para outras funções se necessário (has_role e proximo_numero_venda já devem estar configuradas, mas reforçamos)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
