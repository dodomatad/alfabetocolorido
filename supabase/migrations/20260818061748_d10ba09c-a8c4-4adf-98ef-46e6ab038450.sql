-- Identificar funções SECURITY DEFINER no schema public e ajustar permissões e search_path
DO $$
DECLARE
    func_name text;
    func_args text;
BEGIN
    FOR func_name, func_args IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        -- Revogar acesso público (anon)
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC', func_name, func_args);
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM anon', func_name, func_args);
        
        -- Garantir search_path seguro
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', func_name, func_args);
        
        -- Permitir apenas usuários autenticados e service_role
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role', func_name, func_args);
    END LOOP;
END $$;
