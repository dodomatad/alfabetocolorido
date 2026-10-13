-- MIGRATION: Remover trigger legada que referencia coluna inexistente "tipo_perfil"
-- e criar a nova versão segura da função handle_sync_producao_para_estoque

DROP TRIGGER IF EXISTS trigger_sync_producao_para_estoque ON public.producao_diaria;

CREATE OR REPLACE FUNCTION public.handle_sync_producao_para_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$ 
BEGIN 
    -- Como a esteira moderna já insere diretamente os itens nominais em public.estoque,
    -- este trigger apenas retorna NEW de forma segura sem quebrar o INSERT.
    RETURN NEW; 
END; 
$$;

-- Recria a trigger caso o banco necessite da existência do trigger
CREATE TRIGGER trigger_sync_producao_para_estoque
AFTER INSERT OR UPDATE ON public.producao_diaria
FOR EACH ROW EXECUTE FUNCTION public.handle_sync_producao_para_estoque();
