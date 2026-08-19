-- 1. Garantir que a tabela de estoque exista e possua os campos necessários
CREATE TABLE IF NOT EXISTS public.estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_ativo TEXT NOT NULL, -- Ex: 'BM Ilimitada', 'BM 250', 'Perfil Farmado'
    quantidade_disponivel INTEGER NOT NULL DEFAULT 0,
    quantidade_reservada INTEGER NOT NULL DEFAULT 0,
    custo_medio_unitario NUMERIC(10,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'em_estoque',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS e conceder privilégios
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT ALL ON public.estoque TO service_role;

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gerenciar estoque para autenticados da mesma empresa" ON public.estoque;
CREATE POLICY "Gerenciar estoque para autenticados da mesma empresa"
ON public.estoque FOR ALL
TO authenticated
USING (empresa_id = internal.empresa_atual())
WITH CHECK (empresa_id = internal.empresa_atual());

-- 3. Criar constraint de unicidade para suportar o ON CONFLICT por empresa e tipo
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_estoque_empresa_tipo'
    ) THEN 
        ALTER TABLE public.estoque ADD CONSTRAINT uq_estoque_empresa_tipo UNIQUE (empresa_id, tipo_ativo);
    END IF; 
END $$;

-- 4. Função Trigger: Somar automaticamente as BMs prontas no Estoque
CREATE OR REPLACE FUNCTION public.handle_sync_producao_para_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$ 
DECLARE 
    _tipo TEXT; 
    _qtd_adicionar INTEGER; 
BEGIN 
    -- Prioriza tipo_bm, depois tipo_perfil, com fallback
    _tipo := COALESCE(NEW.tipo_bm, NEW.tipo_perfil, 'BM Padrão'); 
    
    -- Considera a quantidade de contas aprovadas/concluídas com sucesso
    _qtd_adicionar := COALESCE(NEW.quantidade_aprovadas, NEW.quantidade, 0); 

    IF (TG_OP = 'INSERT' AND _qtd_adicionar > 0) THEN 
        -- Se o item já existir no estoque da empresa, soma a quantidade; senão, cria o registro
        INSERT INTO public.estoque (empresa_id, tipo_ativo, quantidade_disponivel, updated_at) 
        VALUES (NEW.empresa_id, _tipo, _qtd_adicionar, NOW()) 
        ON CONFLICT (empresa_id, tipo_ativo) 
        DO UPDATE SET 
            quantidade_disponivel = public.estoque.quantidade_disponivel + EXCLUDED.quantidade_disponivel, 
            updated_at = NOW(); 

    ELSIF (TG_OP = 'UPDATE') THEN 
        -- Ajusta a diferença caso o operador edite a quantidade de BMs aprovadas na esteira
        DECLARE 
            _diferenca INTEGER; 
            _qtd_nova INTEGER;
            _qtd_antiga INTEGER;
        BEGIN 
            _qtd_nova := COALESCE(NEW.quantidade_aprovadas, NEW.quantidade, 0);
            _qtd_antiga := COALESCE(OLD.quantidade_aprovadas, OLD.quantidade, 0);
            _diferenca := _qtd_nova - _qtd_antiga; 
                         
            IF (_diferenca <> 0) THEN 
                INSERT INTO public.estoque (empresa_id, tipo_ativo, quantidade_disponivel, updated_at) 
                VALUES (NEW.empresa_id, _tipo, GREATEST(0, _diferenca), NOW()) 
                ON CONFLICT (empresa_id, tipo_ativo) 
                DO UPDATE SET 
                    quantidade_disponivel = GREATEST(0, public.estoque.quantidade_disponivel + _diferenca), 
                    updated_at = NOW(); 
            END IF; 
        END; 
    END IF; 

    RETURN NEW; 
END; 
$$;

-- 5. Associar o Trigger à tabela de produção
DROP TRIGGER IF EXISTS trigger_sync_producao_para_estoque ON public.producao_diaria;
CREATE TRIGGER trigger_sync_producao_para_estoque
AFTER INSERT OR UPDATE ON public.producao_diaria
FOR EACH ROW EXECUTE FUNCTION public.handle_sync_producao_para_estoque();

-- 6. Garantir permissões de execução para as triggers
REVOKE ALL ON FUNCTION public.handle_sync_producao_para_estoque() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_sync_producao_para_estoque() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_sync_producao_para_estoque() TO service_role;

-- 7. Recarregar o cache do schema do PostgREST
NOTIFY pgrst, 'reload schema';
