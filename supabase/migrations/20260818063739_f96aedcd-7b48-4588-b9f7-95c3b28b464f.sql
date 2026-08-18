-- 1. Adicionar a coluna numero_venda caso não exista
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS numero_venda BIGSERIAL;

-- 2. Garantir que as vendas existentes recebam uma numeração única
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM public.vendas WHERE numero_venda IS NULL) THEN
        WITH numeradas AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
            FROM public.vendas
        )
        UPDATE public.vendas v
        SET numero_venda = n.row_num
        FROM numeradas n
        WHERE v.id = n.id AND v.numero_venda IS NULL;
    END IF; 
END $$;

-- 3. Atualizar a função RPC para gerar o próximo número de forma segura
CREATE OR REPLACE FUNCTION public.proximo_numero_venda(_empresa TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- 4. Conceder permissão de execução
-- Nota: Acesso apenas para authenticated e service_role por segurança, revogando public/anon se necessário
REVOKE ALL ON FUNCTION public.proximo_numero_venda(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(TEXT) TO authenticated, service_role;

-- 5. Recarregar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';