-- ==============================================================================
-- MIGRATION: RPC Transacional de Baixa Atômica de BMs e Normalização de limite_bm
-- ==============================================================================

-- 1. Normalizar dados antigos na tabela estoque para '250', '2k', '10k', '100k'
UPDATE public.estoque
SET limite_bm = CASE
    WHEN limite_bm ILIKE '%100k%' OR tipo_ativo ILIKE '%100k%' THEN '100k'
    WHEN limite_bm ILIKE '%10k%' OR tipo_ativo ILIKE '%10k%' THEN '10k'
    WHEN limite_bm ILIKE '%2k%' OR tipo_ativo ILIKE '%2k%' THEN '2k'
    WHEN limite_bm ILIKE '%250%' OR tipo_ativo ILIKE '%250%' THEN '250'
    ELSE LOWER(TRIM(REPLACE(limite_bm, 'BM ', '')))
END
WHERE limite_bm IS NOT NULL;

-- 2. Garantir coluna venda_id na tabela estoque se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'venda_id'
    ) THEN
        ALTER TABLE public.estoque ADD COLUMN venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Criar função RPC transacional para baixa atômica de BMs vendidas com validação de ROW_COUNT
CREATE OR REPLACE FUNCTION public.baixar_bms_venda(
    p_empresa_id UUID,
    p_venda_id UUID,
    p_cliente_id UUID,
    p_destinatario TEXT,
    p_bms_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_esperado INT;
    v_linhas_afetadas INT;
    v_bms_indisponiveis TEXT[];
BEGIN
    -- Validação inicial dos parâmetros
    IF p_bms_ids IS NULL OR array_length(p_bms_ids, 1) IS NULL OR array_length(p_bms_ids, 1) = 0 THEN
        RETURN jsonb_build_object('sucesso', true, 'afetadas', 0, 'mensagem', 'Nenhuma BM informada para baixa.');
    END IF;

    v_total_esperado := array_length(p_bms_ids, 1);

    -- Identificar se alguma das BMs não pertence à empresa ou não está disponível
    SELECT array_agg(COALESCE(nome_bm, tipo_ativo, id::text))
    INTO v_bms_indisponiveis
    FROM public.estoque
    WHERE id = ANY(p_bms_ids)
      AND empresa_id = p_empresa_id
      AND (status != 'disponivel' OR quantidade_disponivel <= 0);

    IF v_bms_indisponiveis IS NOT NULL AND array_length(v_bms_indisponiveis, 1) > 0 THEN
        RAISE EXCEPTION 'As seguintes BMs não estão mais disponíveis para venda: %', array_to_string(v_bms_indisponiveis, ', ');
    END IF;

    -- Executar a baixa atômica com trava explícita e WHERE estrito
    UPDATE public.estoque
    SET 
        status = 'vendida',
        quantidade_disponivel = 0,
        status_envio = 'entregue',
        venda_id = p_venda_id,
        cliente_id = p_cliente_id,
        destinatario = COALESCE(p_destinatario, destinatario),
        updated_at = timezone('utc'::text, now())
    WHERE id = ANY(p_bms_ids)
      AND empresa_id = p_empresa_id
      AND status = 'disponivel';

    GET DIAGNOSTICS v_linhas_afetadas = ROW_COUNT;

    -- Se o total afetado for menor do que o solicitado, abortar a operação (ROLLBACK)
    IF v_linhas_afetadas < v_total_esperado THEN
        RAISE EXCEPTION 'Operação cancelada: esperava dar baixa em % BM(s), mas apenas % estavam disponíveis.', v_total_esperado, v_linhas_afetadas;
    END IF;

    RETURN jsonb_build_object(
        'sucesso', true,
        'afetadas', v_linhas_afetadas,
        'mensagem', format('Baixa concluída com sucesso em %s BM(s).', v_linhas_afetadas)
    );
END;
$$;

-- Permissões na função RPC
GRANT EXECUTE ON FUNCTION public.baixar_bms_venda(UUID, UUID, UUID, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.baixar_bms_venda(UUID, UUID, UUID, TEXT, UUID[]) TO service_role;

-- Recarregar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
