-- Adicionar a coluna tipo_bm na tabela de produção diária para sincronização com estoque
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'producao_diaria' AND column_name = 'tipo_bm') THEN
        ALTER TABLE public.producao_diaria ADD COLUMN tipo_bm TEXT DEFAULT 'BM 250';
    END IF;
END $$;

-- Atualizar a função handle_sync_producao_para_estoque para garantir que use a coluna tipo_bm se disponível
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
    -- Prioriza a nova coluna tipo_bm, depois tipo_perfil, com fallback
    _tipo := COALESCE(NEW.tipo_bm, NEW.tipo_perfil, 'BM 250'); 
    
    -- Considera a quantidade de contas viradas/concluídas com sucesso
    _qtd_adicionar := COALESCE(NEW.contas_viradas, NEW.quantidade_aprovadas, 0); 

    IF (TG_OP = 'INSERT' AND _qtd_adicionar > 0) THEN 
        -- Se o item já existir no estoque da empresa, soma a quantidade; senão, cria o registro
        INSERT INTO public.estoque (empresa_id, tipo_ativo, quantidade_disponivel, updated_at) 
        VALUES (NEW.empresa_id, _tipo, _qtd_adicionar, NOW()) 
        ON CONFLICT (empresa_id, tipo_ativo) 
        DO UPDATE SET 
            quantidade_disponivel = public.estoque.quantidade_disponivel + EXCLUDED.quantidade_disponivel, 
            updated_at = NOW(); 

    ELSIF (TG_OP = 'UPDATE') THEN 
        -- Ajusta a diferença caso o operador edite a quantidade na esteira
        DECLARE 
            _diferenca INTEGER; 
            _qtd_nova INTEGER;
            _qtd_antiga INTEGER;
        BEGIN 
            _qtd_nova := COALESCE(NEW.contas_viradas, NEW.quantidade_aprovadas, 0);
            _qtd_antiga := COALESCE(OLD.contas_viradas, OLD.quantidade_aprovadas, 0);
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
