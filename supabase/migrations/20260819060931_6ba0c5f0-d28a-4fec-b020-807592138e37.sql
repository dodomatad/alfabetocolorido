-- Revogar acesso público/autenticado da função de onboarding
REVOKE EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) TO service_role;

-- Garantir search_path seguro nas funções SECURITY DEFINER para mitigar alertas do linter
ALTER FUNCTION public.has_role(UUID, TEXT) SET search_path = public, internal, pg_temp;
ALTER FUNCTION internal.empresa_atual() SET search_path = public, internal, pg_temp;
ALTER FUNCTION internal.pode_gerenciar() SET search_path = public, internal, pg_temp;
ALTER FUNCTION public.check_permission(UUID, TEXT, TEXT) SET search_path = public, internal, pg_temp;
ALTER FUNCTION public.onboarding_novo_usuario(TEXT) SET search_path = public, internal, pg_temp;
