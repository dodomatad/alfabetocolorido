-- ==============================================================================
-- MIGRATION CONSOLIDADA DE CORREÇÃO: ESTOQUE, PRODUÇÃO E RPC BAIXAR_BMS_VENDA
-- Projeto Supabase: cyyxrobdcyzosxlgdweu
-- ==============================================================================

-- 1. DESATIVAR / AJUSTAR CONSTRAINT RESTRIFICA EM ESTOQUE
-- Permite cadastrar múltiplos registros individuais de ativos para a mesma empresa
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS uq_estoque_empresa_tipo;

-- 2. GARANTIR COLUNAS EM public.estoque
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS limite_bm TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome_bm TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS status_envio TEXT DEFAULT 'disponivel';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS tem_template BOOLEAN DEFAULT false;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS data_criacao DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS destinatario TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'producao';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS producao_id UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL;

-- 3. GARANTIR COLUNAS EM public.producao_diaria
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS data_registro DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS funcionario_id TEXT;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS funcionario_nome TEXT;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS operador TEXT DEFAULT '';
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS operador_id UUID;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS tipo_ativo TEXT DEFAULT 'BM 250';
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS tipo_bm TEXT DEFAULT 'BM 250';
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS recebidas_fornecedor INTEGER DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS bms_criadas INTEGER DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS contas_viradas INTEGER DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS bloqueios INTEGER DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS prontas_estoque INTEGER DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS aproveitamento NUMERIC DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS motivo_queda TEXT;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 4. CRIAR TABELA public.contas_enviadas SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.contas_enviadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    bm_id UUID REFERENCES public.estoque(id) ON DELETE SET NULL,
    venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
    nome_bm TEXT NOT NULL,
    limite_bm TEXT,
    destinatario_cliente TEXT NOT NULL,
    responsavel_envio TEXT,
    data_envio DATE NOT NULL DEFAULT CURRENT_DATE,
    custo_unitario NUMERIC(10,2) DEFAULT 0.00,
    valor_venda NUMERIC(10,2) DEFAULT 0.00,
    status_envio TEXT NOT NULL DEFAULT 'enviada',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contas_enviadas ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_enviadas TO authenticated;
GRANT ALL ON public.contas_enviadas TO service_role;

DROP POLICY IF EXISTS "Gerenciar contas_enviadas para autenticados da mesma empresa" ON public.contas_enviadas;
CREATE POLICY "Gerenciar contas_enviadas para autenticados da mesma empresa"
ON public.contas_enviadas FOR ALL
TO authenticated
USING (empresa_id = internal.empresa_atual())
WITH CHECK (empresa_id = internal.empresa_atual());

-- 5. NORMALIZAÇÃO SEGURA DOS LIMITES EM public.estoque (preserva não identificados)
UPDATE public.estoque
SET limite_bm = CASE
    WHEN limite_bm ILIKE '%100k%' OR tipo_ativo ILIKE '%100k%' THEN '100k'
    WHEN limite_bm ILIKE '%10k%'  OR tipo_ativo ILIKE '%10k%'  THEN '10k'
    WHEN limite_bm ILIKE '%2k%'   OR tipo_ativo ILIKE '%2k%'   THEN '2k'
    WHEN limite_bm ILIKE '%250%'  OR tipo_ativo ILIKE '%250%'  THEN '250'
    ELSE limite_bm
END
WHERE (limite_bm IS NOT NULL OR tipo_ativo IS NOT NULL)
  AND (
      limite_bm ILIKE '%100k%' OR tipo_ativo ILIKE '%100k%' OR
      limite_bm ILIKE '%10k%'  OR tipo_ativo ILIKE '%10k%'  OR
      limite_bm ILIKE '%2k%'   OR tipo_ativo ILIKE '%2k%'   OR
      limite_bm ILIKE '%250%'  OR tipo_ativo ILIKE '%250%'
  );

-- 6. FUNÇÃO RPC TRANSACIONAL public.baixar_bms_venda COM TRAVA DE CONCORRÊNCIA E SEGURANÇA
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
SET search_path = public, internal, pg_temp
AS $$
DECLARE
    v_user_empresa UUID;
    v_total_esperado INT;
    v_linhas_afetadas INT;
    v_venda_empresa UUID;
    v_bms_indisponiveis TEXT[];
BEGIN
    -- [Segurança 1]: Verificar identidade do usuário autenticado e empresa_id correspondente
    v_user_empresa := internal.empresa_atual();
    IF v_user_empresa IS NULL OR v_user_empresa != p_empresa_id THEN
        RAISE EXCEPTION 'Acesso negado: a empresa informada não corresponde à empresa do usuário autenticado.';
    END IF;

    -- [Validação 2]: Lista de IDs não pode ser vazia
    IF p_bms_ids IS NULL OR array_length(p_bms_ids, 1) IS NULL OR array_length(p_bms_ids, 1) = 0 THEN
        RETURN jsonb_build_object('sucesso', true, 'afetadas', 0, 'mensagem', 'Nenhuma BM informada para baixa.');
    END IF;

    v_total_esperado := array_length(p_bms_ids, 1);

    -- [Validação 3]: Se venda_id foi fornecido, validar que a venda existe e pertence à mesma empresa
    IF p_venda_id IS NOT NULL THEN
        SELECT empresa_id INTO v_venda_empresa FROM public.vendas WHERE id = p_venda_id;
        IF v_venda_empresa IS NULL OR v_venda_empresa != p_empresa_id THEN
            RAISE EXCEPTION 'A venda informada não existe ou pertence a outra empresa.';
        END IF;
    END IF;

    -- [Concorrência 4]: Bloquear linhas (FOR UPDATE) e verificar se todas existem, pertencem à empresa e estão disponíveis
    SELECT array_agg(COALESCE(nome_bm, tipo_ativo, id::text))
    INTO v_bms_indisponiveis
    FROM public.estoque
    WHERE id = ANY(p_bms_ids)
      AND empresa_id = p_empresa_id
      AND (status NOT IN ('disponivel', 'em_estoque') OR quantidade_disponivel <= 0)
    FOR UPDATE;

    IF v_bms_indisponiveis IS NOT NULL AND array_length(v_bms_indisponiveis, 1) > 0 THEN
        RAISE EXCEPTION 'As seguintes BMs não estão mais disponíveis para venda: %', array_to_string(v_bms_indisponiveis, ', ');
    END IF;

    -- [Execução 5]: Baixa atômica nas linhas bloqueadas
    UPDATE public.estoque
    SET 
        status = 'vendida',
        quantidade_disponivel = 0,
        status_envio = 'entregue',
        venda_id = p_venda_id,
        cliente_id = p_cliente_id,
        destinatario = COALESCE(NULLIF(TRIM(p_destinatario), ''), destinatario),
        updated_at = timezone('utc'::text, now())
    WHERE id = ANY(p_bms_ids)
      AND empresa_id = p_empresa_id
      AND status IN ('disponivel', 'em_estoque');

    GET DIAGNOSTICS v_linhas_afetadas = ROW_COUNT;

    -- [Integridade 6]: Rollback imediato se o número de linhas afetadas divergir do total esperado
    IF v_linhas_afetadas < v_total_esperado THEN
        RAISE EXCEPTION 'Operação cancelada por concorrência: esperava dar baixa em % BM(s), mas apenas % estavam disponíveis.', v_total_esperado, v_linhas_afetadas;
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

-- 7. Notificar o PostgREST para recarregar o schema cache imediatamente
NOTIFY pgrst, 'reload schema';
