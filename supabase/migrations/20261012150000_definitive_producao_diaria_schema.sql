-- ==============================================================================
-- MIGRATION DEFINITIVA: Correção e Alinhamento Completo da Tabela producao_diaria
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.producao_diaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  criado_por UUID,
  atualizado_por UUID,
  data_registro DATE DEFAULT CURRENT_DATE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  funcionario_id TEXT,
  funcionario_nome TEXT,
  operador TEXT NOT NULL DEFAULT '',
  operador_id UUID,
  tipo_ativo TEXT DEFAULT 'BM 250',
  tipo_bm TEXT DEFAULT 'BM 250',
  recebidas_fornecedor INTEGER DEFAULT 0,
  bms_criadas INTEGER DEFAULT 0,
  contas_viradas INTEGER DEFAULT 0,
  bloqueios INTEGER DEFAULT 0,
  prontas_estoque INTEGER DEFAULT 0,
  aproveitamento NUMERIC DEFAULT 0,
  bms_aquecidas INTEGER DEFAULT 0,
  contas_subidas INTEGER DEFAULT 0,
  meta_diaria INTEGER DEFAULT 10,
  motivo_queda TEXT,
  observacoes TEXT,
  nome_bm TEXT,
  limite_bm TEXT,
  tem_template BOOLEAN DEFAULT false,
  destinatario TEXT,
  status_envio TEXT DEFAULT 'disponivel',
  quantidade INTEGER DEFAULT 1
);

-- Garantir adição de todas as colunas caso a tabela já exista:
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
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS bms_aquecidas INTEGER DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS contas_subidas INTEGER DEFAULT 0;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS meta_diaria INTEGER DEFAULT 10;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS nome_bm TEXT;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS limite_bm TEXT;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS tem_template BOOLEAN DEFAULT false;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS destinatario TEXT;
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS status_envio TEXT DEFAULT 'disponivel';
ALTER TABLE public.producao_diaria ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 1;

-- Recarregar cache de schema do PostgREST imediatamente:
NOTIFY pgrst, 'reload schema';
