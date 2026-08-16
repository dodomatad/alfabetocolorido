CREATE SCHEMA IF NOT EXISTS internal;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA internal;
ALTER FUNCTION public.tem_permissao(uuid, public.modulo_sistema, text) SET SCHEMA internal;
ALTER FUNCTION public.empresa_atual() SET SCHEMA internal;
ALTER FUNCTION public.pode_gerenciar() SET SCHEMA internal;
ALTER FUNCTION public.proximo_numero_venda(uuid) SET SCHEMA internal;
ALTER FUNCTION public.registrar_auditoria() SET SCHEMA internal;
ALTER FUNCTION public.criar_empresa_inicial(text, text, text, text) SET SCHEMA internal;

REVOKE ALL ON SCHEMA internal FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA internal TO service_role, authenticated;
