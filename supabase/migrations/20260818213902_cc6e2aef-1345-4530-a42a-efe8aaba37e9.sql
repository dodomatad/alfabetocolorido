REVOKE EXECUTE ON FUNCTION public.proximo_numero_venda() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda() TO authenticated, service_role;
