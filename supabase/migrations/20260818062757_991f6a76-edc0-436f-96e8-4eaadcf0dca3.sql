-- 1. Remover todas as versões existentes da função proximo_numero_venda
DROP FUNCTION IF EXISTS public.proximo_numero_venda(TEXT);
DROP FUNCTION IF EXISTS public.proximo_numero_venda(UUID);
DROP FUNCTION IF EXISTS public.proximo_numero_venda();

-- 2. Recriar uma versão única sem parâmetros obrigatórios ambíguos
CREATE OR REPLACE FUNCTION public.proximo_numero_venda(_empresa TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
DECLARE 
    proximo_num INTEGER; 
BEGIN 
    SELECT COALESCE(MAX(numero_venda), 0) + 1 
    INTO proximo_num 
    FROM public.vendas;
    
    RETURN proximo_num; 
END; 
$$;

-- 3. Conceder permissões de execução
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(TEXT) TO service_role;

-- 4. Forçar o recarregamento do cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';