-- ==============================================================================
-- MIGRATION CONSOLIDADA DE CORREÇÃO DO ESTOQUE E RPC: SCA
-- Projeto Supabase: cyyxrobdcyzosxlgdweu
-- Migration: 20261012160000_revisao_final_rpc_e_estoque.sql
-- ==============================================================================

-- 1. DESATIVAR / AJUSTAR CONSTRAINT RESTRIFICA EM ESTOQUE
-- Justificativa técnica: a constraint antiga UNIQUE (empresa_id, tipo_ativo)
-- impede o cadastro de múltiplas BMs individuais com o mesmo tipo (ex: duas "BM 2K"
-- com nomes diferentes para a mesma empresa). O modelo serializado exige essa remoção.
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS uq_estoque_empresa_tipo;

-- 2. GARANTIR COLUNAS EM public.estoque COM TIPOS E DEFAULTS IDEMPOTENTES
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
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- 3. GARANTIR CRIAÇÃO E COLUNAS EM public.producao_diaria
CREATE TABLE IF NOT EXISTS public.producao_diaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data_registro DATE DEFAULT CURRENT_DATE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    funcionario_id TEXT,
    funcionario_nome TEXT,
    operador TEXT DEFAULT '',
    operador_id UUID,
    tipo_ativo TEXT DEFAULT 'BM 250',
    tipo_bm TEXT DEFAULT 'BM 250',
    recebidas_fornecedor INTEGER DEFAULT 0,
    bms_criadas INTEGER DEFAULT 0,
    contas_viradas INTEGER DEFAULT 0,
    bloqueios INTEGER DEFAULT 0,
    prontas_estoque INTEGER DEFAULT 0,
    aproveitamento NUMERIC DEFAULT 0,
    motivo_queda TEXT,
    observacoes TEXT
);

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

-- 4. GARANTIR CRIAÇÃO E POLICIES EM public.contas_enviadas
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

-- 5. ATUALIZAR O TRIGGER DE SINCRONIZAÇÃO DE PRODUÇÃO PARA NÃO DEPENDER DE uq_estoque_empresa_tipo
CREATE OR REPLACE FUNCTION public.handle_sync_producao_para_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$ 
DECLARE 
    _tipo TEXT; 
    _qtd_adicionar INTEGER; 
    _estoque_id UUID;
    _qtd_existente INTEGER;
BEGIN 
    _tipo := COALESCE(NEW.tipo_bm, NEW.tipo_ativo, 'BM 250'); 
    _qtd_adicionar := COALESCE(NEW.contas_viradas, NEW.prontas_estoque, NEW.bms_criadas, 0); 

    IF (TG_OP = 'INSERT' AND _qtd_adicionar > 0) THEN 
        -- Localiza se já existe um registro genérico/agregado (sem nome_bm específico)
        SELECT id, quantidade_disponivel INTO _estoque_id, _qtd_existente
        FROM public.estoque
        WHERE empresa_id = NEW.empresa_id 
          AND tipo_ativo = _tipo 
          AND (nome_bm IS NULL OR nome_bm = '')
        LIMIT 1;

        IF _estoque_id IS NOT NULL THEN
            UPDATE public.estoque
            SET quantidade_disponivel = _qtd_existente + _qtd_adicionar,
                status = 'em_estoque',
                updated_at = NOW()
            WHERE id = _estoque_id;
        ELSE
            INSERT INTO public.estoque (
                empresa_id, 
                tipo_ativo, 
                limite_bm, 
                quantidade_disponivel, 
                quantidade_reservada, 
                status, 
                origem, 
                producao_id, 
                updated_at
            ) VALUES (
                NEW.empresa_id, 
                _tipo, 
                REPLACE(_tipo, 'BM ', ''), 
                _qtd_adicionar, 
                0, 
                'em_estoque', 
                'producao', 
                NEW.id, 
                NOW()
            );
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN 
        DECLARE 
            _diferenca INTEGER; 
            _qtd_nova INTEGER;
            _qtd_antiga INTEGER;
        BEGIN 
            _qtd_nova := COALESCE(NEW.contas_viradas, NEW.prontas_estoque, NEW.bms_criadas, 0);
            _qtd_antiga := COALESCE(OLD.contas_viradas, OLD.prontas_estoque, OLD.bms_criadas, 0);
            _diferenca := _qtd_nova - _qtd_antiga; 
                         
            IF (_diferenca <> 0) THEN 
                SELECT id, quantidade_disponivel INTO _estoque_id, _qtd_existente
                FROM public.estoque
                WHERE empresa_id = NEW.empresa_id 
                  AND tipo_ativo = _tipo 
                  AND (nome_bm IS NULL OR nome_bm = '')
                LIMIT 1;

                IF _estoque_id IS NOT NULL THEN
                    UPDATE public.estoque
                    SET quantidade_disponivel = GREATEST(0, _qtd_existente + _diferenca),
                        status = CASE WHEN (_qtd_existente + _diferenca) > 0 THEN 'em_estoque' ELSE 'esgotado' END,
                        updated_at = NOW()
                    WHERE id = _estoque_id;
                ELSE
                    IF _diferenca > 0 THEN
                        INSERT INTO public.estoque (
                            empresa_id, 
                            tipo_ativo, 
                            limite_bm, 
                            quantidade_disponivel, 
                            quantidade_reservada, 
                            status, 
                            origem, 
                            producao_id, 
                            updated_at
                        ) VALUES (
                            NEW.empresa_id, 
                            _tipo, 
                            REPLACE(_tipo, 'BM ', ''), 
                            _diferenca, 
                            0, 
                            'em_estoque', 
                            'producao', 
                            NEW.id, 
                            NOW()
                        );
                    END IF;
                END IF;
            END IF; 
        END; 
    END IF; 

    RETURN NEW; 
END; 
$$;

-- 6. NORMALIZAÇÃO NÃO-DESTRUTIVA DOS LIMITES EM public.estoque
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

-- 7. FUNÇÃO RPC TRANSACIONAL public.baixar_bms_venda
DROP FUNCTION IF EXISTS public.baixar_bms_venda(UUID, UUID, UUID, TEXT, UUID[]);
DROP FUNCTION IF EXISTS public.baixar_bms_venda(UUID, UUID, UUID, TEXT, UUID[], TEXT);

CREATE OR REPLACE FUNCTION public.baixar_bms_venda(
    p_empresa_id UUID,
    p_venda_id UUID,
    p_cliente_id UUID,
    p_destinatario TEXT,
    p_bms_ids UUID[],
    p_status_envio TEXT DEFAULT 'entregue'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$
DECLARE
    v_user_empresa UUID;
    v_total_esperado INT;
    v_total_encontrado INT;
    v_linhas_afetadas INT;
    v_bms_unicos UUID[];
    v_bms_indisponiveis TEXT[];
    v_status_envio_final TEXT;
BEGIN
    -- [Segurança 1]: Validar autenticação e empresa ativa
    v_user_empresa := internal.empresa_atual();
    IF v_user_empresa IS NULL OR v_user_empresa != p_empresa_id THEN
        RAISE EXCEPTION 'Acesso negado: a empresa informada (%) não corresponde à empresa do usuário autenticado.', p_empresa_id;
    END IF;

    -- [Validação 2]: Lista de IDs não pode ser vazia
    IF p_bms_ids IS NULL OR array_length(p_bms_ids, 1) IS NULL OR array_length(p_bms_ids, 1) = 0 THEN
        RETURN jsonb_build_object('sucesso', true, 'afetadas', 0, 'mensagem', 'Nenhuma BM informada para baixa.');
    END IF;

    -- [Desduplicação 3]: Obter lista única de IDs para garantir integridade matemática
    SELECT COALESCE(array_agg(DISTINCT elem), '{}'::UUID[])
    INTO v_bms_unicos
    FROM unnest(p_bms_ids) AS t(elem);

    v_total_esperado := COALESCE(array_length(v_bms_unicos, 1), 0);
    IF v_total_esperado = 0 THEN
        RETURN jsonb_build_object('sucesso', true, 'afetadas', 0, 'mensagem', 'Nenhum ID válido informado para baixa.');
    END IF;

    -- [Validação 4]: Se venda_id foi fornecido, validar existência e tenant
    IF p_venda_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.vendas WHERE id = p_venda_id AND empresa_id = p_empresa_id) THEN
            RAISE EXCEPTION 'A venda informada (%) não existe ou pertence a outra empresa.', p_venda_id;
        END IF;
    END IF;

    -- [Validação 5]: Se cliente_id foi fornecido, validar existência e tenant
    IF p_cliente_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.clientes WHERE id = p_cliente_id AND empresa_id = p_empresa_id) THEN
            RAISE EXCEPTION 'O cliente informado (%) não existe ou pertence a outra empresa.', p_cliente_id;
        END IF;
    END IF;

    -- [Bloqueio e Concorrência 6]: Bloquear as linhas linha a linha com FOR UPDATE
    PERFORM 1
    FROM public.estoque
    WHERE id = ANY(v_bms_unicos)
      AND empresa_id = p_empresa_id
    FOR UPDATE;

    -- [Validação 7]: Confirmar existência de todas as BMs para esta empresa
    SELECT count(*)
    INTO v_total_encontrado
    FROM public.estoque
    WHERE id = ANY(v_bms_unicos)
      AND empresa_id = p_empresa_id;

    IF v_total_encontrado < v_total_esperado THEN
        RAISE EXCEPTION 'Uma ou mais BMs solicitadas não existem no estoque ou pertencem a outra empresa (esperado: %, encontrado: %).',
            v_total_esperado, v_total_encontrado;
    END IF;

    -- [Validação 8]: Verificar se alguma BM já está indisponível/vendida
    SELECT array_agg(COALESCE(nome_bm, tipo_ativo, id::text))
    INTO v_bms_indisponiveis
    FROM public.estoque
    WHERE id = ANY(v_bms_unicos)
      AND empresa_id = p_empresa_id
      AND (status NOT IN ('disponivel', 'em_estoque') OR quantidade_disponivel <= 0);

    IF v_bms_indisponiveis IS NOT NULL AND array_length(v_bms_indisponiveis, 1) > 0 THEN
        RAISE EXCEPTION 'As seguintes BMs não estão mais disponíveis para venda: %', array_to_string(v_bms_indisponiveis, ', ');
    END IF;

    v_status_envio_final := COALESCE(NULLIF(TRIM(p_status_envio), ''), 'entregue');

    -- [Execução 9]: Baixa atômica e atribuição de venda/cliente/destinatário
    UPDATE public.estoque
    SET 
        status = 'vendida',
        quantidade_disponivel = 0,
        status_envio = v_status_envio_final,
        venda_id = p_venda_id,
        cliente_id = p_cliente_id,
        destinatario = COALESCE(NULLIF(TRIM(p_destinatario), ''), destinatario),
        updated_at = timezone('utc'::text, now())
    WHERE id = ANY(v_bms_unicos)
      AND empresa_id = p_empresa_id
      AND status IN ('disponivel', 'em_estoque');

    GET DIAGNOSTICS v_linhas_afetadas = ROW_COUNT;

    -- [Integridade 10]: Abortar com rollback imediato se a contagem não bater
    IF v_linhas_afetadas < v_total_esperado THEN
        RAISE EXCEPTION 'Operação cancelada por concorrência: esperava dar baixa em % BM(s), mas apenas % foram atualizadas.',
            v_total_esperado, v_linhas_afetadas;
    END IF;

    RETURN jsonb_build_object(
        'sucesso', true,
        'afetadas', v_linhas_afetadas,
        'mensagem', format('Baixa concluída com sucesso em %s BM(s).', v_linhas_afetadas)
    );
END;
$$;

-- Permissões na função RPC
GRANT EXECUTE ON FUNCTION public.baixar_bms_venda(UUID, UUID, UUID, TEXT, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.baixar_bms_venda(UUID, UUID, UUID, TEXT, UUID[], TEXT) TO service_role;

-- 8. NOTIFICAR O POSTGREST PARA RECARREGAR O SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
