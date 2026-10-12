-- Migration: 20261012130000_208a43f8-e3e8-4b4e-9178-eac34562b4d4_fix_estoque_constraints_and_create_contas_enviadas.sql
-- 1. Remover a restrição de unicidade (empresa_id, tipo_ativo) caso ainda exista para permitir múltiplos registros de estoque individuais
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS uq_estoque_empresa_tipo;

-- 2. Garantir que as colunas operacionais da BM existam na tabela estoque
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'nome_bm') THEN
        ALTER TABLE public.estoque ADD COLUMN nome_bm TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'limite_bm') THEN
        ALTER TABLE public.estoque ADD COLUMN limite_bm TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'tem_template') THEN
        ALTER TABLE public.estoque ADD COLUMN tem_template BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'data_criacao') THEN
        ALTER TABLE public.estoque ADD COLUMN data_criacao DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'responsavel') THEN
        ALTER TABLE public.estoque ADD COLUMN responsavel TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'destinatario') THEN
        ALTER TABLE public.estoque ADD COLUMN destinatario TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'estoque' AND column_name = 'status_envio') THEN
        ALTER TABLE public.estoque ADD COLUMN status_envio TEXT DEFAULT 'disponivel';
    END IF;
END $$;

-- 3. Criar tabela de contas enviadas (histórico definitivo de envios e despachos de BMs)
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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS e permissões na tabela contas_enviadas
ALTER TABLE public.contas_enviadas ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_enviadas TO authenticated;
GRANT ALL ON public.contas_enviadas TO service_role;

DROP POLICY IF EXISTS "Gerenciar contas_enviadas para autenticados da mesma empresa" ON public.contas_enviadas;
CREATE POLICY "Gerenciar contas_enviadas para autenticados da mesma empresa"
ON public.contas_enviadas FOR ALL
TO authenticated
USING (empresa_id = internal.empresa_atual())
WITH CHECK (empresa_id = internal.empresa_atual());

-- 5. Atualizar o trigger de sincronização de produção para não falhar caso a constraint uq_estoque_empresa_tipo tenha sido removida
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
    _tipo := COALESCE(NEW.tipo_bm, NEW.tipo_perfil, 'BM 250'); 
    _qtd_adicionar := COALESCE(NEW.contas_viradas, NEW.quantidade_aprovadas, 0); 

    IF (TG_OP = 'INSERT' AND _qtd_adicionar > 0) THEN 
        -- Localiza se já existe um pool anônimo/geral daquele tipo de ativo na empresa
        SELECT id, quantidade_disponivel INTO _estoque_id, _qtd_existente
        FROM public.estoque
        WHERE empresa_id = NEW.empresa_id AND tipo_ativo = _tipo AND (nome_bm IS NULL OR nome_bm = '')
        LIMIT 1;

        IF _estoque_id IS NOT NULL THEN
            UPDATE public.estoque
            SET quantidade_disponivel = _qtd_existente + _qtd_adicionar,
                status = 'em_estoque',
                updated_at = NOW()
            WHERE id = _estoque_id;
        ELSE
            INSERT INTO public.estoque (empresa_id, tipo_ativo, limite_bm, quantidade_disponivel, status, updated_at) 
            VALUES (NEW.empresa_id, _tipo, REPLACE(_tipo, 'BM ', ''), _qtd_adicionar, 'em_estoque', NOW());
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN 
        DECLARE 
            _diferenca INTEGER; 
            _qtd_nova INTEGER;
            _qtd_antiga INTEGER;
        BEGIN 
            _qtd_nova := COALESCE(NEW.contas_viradas, NEW.quantidade_aprovadas, 0);
            _qtd_antiga := COALESCE(OLD.contas_viradas, OLD.quantidade_aprovadas, 0);
            _diferenca := _qtd_nova - _qtd_antiga; 
                         
            IF (_diferenca <> 0) THEN 
                SELECT id, quantidade_disponivel INTO _estoque_id, _qtd_existente
                FROM public.estoque
                WHERE empresa_id = NEW.empresa_id AND tipo_ativo = _tipo AND (nome_bm IS NULL OR nome_bm = '')
                LIMIT 1;

                IF _estoque_id IS NOT NULL THEN
                    UPDATE public.estoque
                    SET quantidade_disponivel = GREATEST(0, _qtd_existente + _diferenca),
                        status = CASE WHEN (_qtd_existente + _diferenca) > 0 THEN 'em_estoque' ELSE 'esgotado' END,
                        updated_at = NOW()
                    WHERE id = _estoque_id;
                ELSIF (_diferenca > 0) THEN
                    INSERT INTO public.estoque (empresa_id, tipo_ativo, limite_bm, quantidade_disponivel, status, updated_at) 
                    VALUES (NEW.empresa_id, _tipo, REPLACE(_tipo, 'BM ', ''), _diferenca, 'em_estoque', NOW());
                END IF;
            END IF; 
        END; 
    END IF; 

    RETURN NEW; 
END; 
$$;

-- 6. Recarregar cache de schema
NOTIFY pgrst, 'reload schema';
