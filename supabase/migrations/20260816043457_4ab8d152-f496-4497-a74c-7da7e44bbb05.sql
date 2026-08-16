-- 1. Revogar acesso de PUBLIC e AUTHENTICATED para as funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.tem_permissao(uuid, public.modulo_sistema, text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.empresa_atual() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.pode_gerenciar() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.proximo_numero_venda(uuid) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_auditoria() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.criar_empresa_inicial(text, text, text, text) FROM PUBLIC, authenticated;

-- 2. Conceder execução apenas para service_role (elas são usadas via RLS ou triggers que rodam com privilégios de quem definiu)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.tem_permissao(uuid, public.modulo_sistema, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.empresa_atual() TO service_role;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO service_role;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_auditoria() TO service_role;
GRANT EXECUTE ON FUNCTION public.criar_empresa_inicial(text, text, text, text) TO service_role;

-- 3. Caso precisem ser chamadas pelo cliente autenticado via RLS, o GRANTauthenticated é necessário, mas o linter reclama.
-- O linter sugere que se a função é SECURITY DEFINER e está no esquema public, ela é um risco.
-- Para o has_role e tem_permissao que são usados em políticas de RLS, eles precisam ser chamáveis.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tem_permissao(uuid, public.modulo_sistema, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.empresa_atual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO authenticated;
