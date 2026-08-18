
CREATE OR REPLACE FUNCTION public.proximo_numero_venda(_empresa TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
DECLARE 
    proximo_num INTEGER; 
BEGIN 
    -- Busca o maior número de venda existente e incrementa + 1 
    SELECT COALESCE(MAX(numero_venda), 0) + 1 
    INTO proximo_num 
    FROM public.vendas; 
         
    RETURN proximo_num; 
END; 
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(TEXT) TO service_role;

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
