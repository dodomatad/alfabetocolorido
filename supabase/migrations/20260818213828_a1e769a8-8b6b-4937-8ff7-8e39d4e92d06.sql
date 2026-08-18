-- 1. Revogar execução pública de funções SECURITY DEFINER (Melhor prática de segurança)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION internal.empresa_atual() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION internal.pode_gerenciar() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_permission(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) FROM PUBLIC, anon;

-- 2. Garantir que apenas authenticated e service_role possam executar
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.empresa_atual() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION internal.pode_gerenciar() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_permission(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) TO authenticated, service_role;

-- 3. Limpeza final de tabelas legadas se existirem
DROP TABLE IF EXISTS public.user_roles CASCADE;
