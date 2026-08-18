
-- 1. Revogar execução pública (anon) de todas as funções sensíveis
REVOKE EXECUTE ON FUNCTION public.onboarding_novo_usuario(text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.check_permission(uuid, modulo_sistema, text) FROM public, anon;

-- 2. Garantir que apenas usuários autenticados e o service_role possam executar
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_permission(uuid, modulo_sistema, text) TO authenticated, service_role;

-- 3. Caso existam outras funções identificadas pelo linter (como internal.*), protegê-las também
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'internal' AND p.proname = 'empresa_atual') THEN
        REVOKE EXECUTE ON FUNCTION internal.empresa_atual() FROM public, anon;
        GRANT EXECUTE ON FUNCTION internal.empresa_atual() TO authenticated, service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'internal' AND p.proname = 'has_role') THEN
        REVOKE EXECUTE ON FUNCTION internal.has_role(uuid, app_role) FROM public, anon;
        GRANT EXECUTE ON FUNCTION internal.has_role(uuid, app_role) TO authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'proximo_numero_venda') THEN
        REVOKE EXECUTE ON FUNCTION public.proximo_numero_venda(text) FROM public, anon;
        GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(text) TO authenticated, service_role;
    END IF;
END $$;
