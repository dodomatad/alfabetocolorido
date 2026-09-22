-- Adiciona a coluna delivery_status na tabela vendas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'vendas' 
          AND column_name = 'delivery_status'
    ) THEN
        ALTER TABLE public.vendas ADD COLUMN delivery_status TEXT DEFAULT 'nao_enviado';
    END IF;
END $$;

-- Atualizar trigger para sincronizar delivery_status e status_entrega de forma consistente
CREATE OR REPLACE FUNCTION public.handle_sync_venda_para_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$
DECLARE
    v_status text;
BEGIN
    v_status := CASE 
        WHEN LOWER(COALESCE(NEW.delivery_status, '')) = 'entregue' THEN 'entregue'
        WHEN LOWER(COALESCE(NEW.status_entrega, '')) = 'entregue' THEN 'entregue'
        ELSE 'pendente'
    END;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.entregas (
            empresa_id,
            venda_id,
            cliente_id,
            data_prevista,
            status,
            data_realizada,
            observacoes,
            created_at
        ) VALUES (
            NEW.empresa_id,
            NEW.id,
            NEW.cliente_id,
            COALESCE(NEW.data_entrega_prevista, CURRENT_DATE),
            v_status,
            CASE WHEN v_status = 'entregue' THEN CURRENT_DATE ELSE NULL END,
            CONCAT('Gerado automaticamente da Venda #', COALESCE(NEW.numero::text, 'S/N')),
            NOW()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status_entrega IS DISTINCT FROM NEW.status_entrega 
            OR OLD.delivery_status IS DISTINCT FROM NEW.delivery_status 
            OR OLD.cliente_id IS DISTINCT FROM NEW.cliente_id) THEN
            UPDATE public.entregas
            SET 
                status = v_status,
                cliente_id = NEW.cliente_id,
                data_realizada = CASE WHEN v_status = 'entregue' THEN COALESCE(data_realizada, CURRENT_DATE) ELSE NULL END,
                updated_at = NOW()
            WHERE venda_id = NEW.id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;
