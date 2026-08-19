-- 1. Garantir que a tabela entregas possua o vínculo venda_id e colunas sincronizadas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entregas' AND column_name = 'venda_id') THEN
        ALTER TABLE public.entregas ADD COLUMN venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendas' AND column_name = 'status_entrega') THEN
        ALTER TABLE public.vendas ADD COLUMN status_entrega TEXT DEFAULT 'Pendente';
    END IF;
END $$;

-- 2. Função Trigger: Sincronizar Venda -> Entrega
CREATE OR REPLACE FUNCTION public.handle_sync_venda_para_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$
BEGIN
    -- Caso 1: Nova venda inserida -> Cria o registro automático em entregas
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.entregas (
            empresa_id,
            venda_id,
            cliente_id,
            data_prevista,
            status,
            observacoes,
            created_at
        ) VALUES (
            NEW.empresa_id,
            NEW.id,
            NEW.cliente_id,
            COALESCE(NEW.data_entrega_prevista, CURRENT_DATE),
            COALESCE(NEW.status_entrega, 'pendente'),
            CONCAT('Gerado automaticamente da Venda #', COALESCE(NEW.numero::text, 'S/N')),
            NOW()
        );
        RETURN NEW;

    -- Caso 2: Atualização na venda -> Sincroniza o status na entrega existente
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status_entrega IS DISTINCT FROM NEW.status_entrega OR OLD.cliente_id IS DISTINCT FROM NEW.cliente_id) THEN
            UPDATE public.entregas
            SET 
                status = LOWER(NEW.status_entrega),
                cliente_id = NEW.cliente_id,
                data_realizada = CASE WHEN NEW.status_entrega = 'entregue' THEN CURRENT_DATE ELSE data_realizada END,
                updated_at = NOW()
            WHERE venda_id = NEW.id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

-- 3. Função Trigger: Sincronizar Entrega -> Venda
CREATE OR REPLACE FUNCTION public.handle_sync_entrega_para_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.venda_id IS NOT NULL) THEN
            UPDATE public.vendas
            SET 
                status_entrega = NEW.status,
                atualizado_at = NOW()
            WHERE id = NEW.venda_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Associar Triggers
DROP TRIGGER IF EXISTS trigger_sync_venda_para_entrega ON public.vendas;
CREATE TRIGGER trigger_sync_venda_para_entrega
AFTER INSERT OR UPDATE ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.handle_sync_venda_para_entrega();

DROP TRIGGER IF EXISTS trigger_sync_entrega_para_venda ON public.entregas;
CREATE TRIGGER trigger_sync_entrega_para_venda
AFTER UPDATE ON public.entregas
FOR EACH ROW EXECUTE FUNCTION public.handle_sync_entrega_para_venda();

-- 5. Recarregar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';