-- Migration Consolidada Definitiva: Estoque, Vendas e Permissões RLS
-- 1. TABELA DE ESTOQUE (bm_inventory / estoque)
CREATE TABLE IF NOT EXISTS public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  data_registro DATE DEFAULT CURRENT_DATE,
  nome TEXT NOT NULL DEFAULT 'BM Sem Nome',
  nome_portfolio TEXT,
  nome_conta TEXT,
  limite TEXT DEFAULT '2K',
  tipo_ativo TEXT DEFAULT 'BM',
  template BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Disponível',
  criador_responsavel TEXT,
  destinatario_cliente TEXT,
  quantidade INTEGER DEFAULT 1,
  custo_unitario NUMERIC DEFAULT 0,
  origem TEXT DEFAULT 'manual',
  producao_id UUID,
  venda_id UUID,
  cliente_id UUID,
  cliente_nome TEXT,
  user_id UUID
);

-- Garantir adição de colunas cruciais caso a tabela já exista:
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS data_registro DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome TEXT DEFAULT 'BM Sem Nome';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome_portfolio TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome_conta TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS limite TEXT DEFAULT '2K';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS tipo_ativo TEXT DEFAULT 'BM';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS template BOOLEAN DEFAULT false;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Disponível';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS criador_responsavel TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS destinatario_cliente TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 1;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC DEFAULT 0;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS producao_id UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS venda_id UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS cliente_id UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS user_id UUID;

-- Manter compatibilidade com colunas legadas da tabela estoque
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome_bm TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS limite_bm TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS destinatario TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS status_envio TEXT DEFAULT 'disponivel';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS tem_template BOOLEAN DEFAULT false;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade_disponivel REAL DEFAULT 1;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade_reservada REAL DEFAULT 0;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS custo_medio_unitario REAL DEFAULT 0;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Remover qualquer restrição de unicidade que cause duplicate key violation
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS uq_estoque_empresa_tipo;

-- 2. TABELA DE VENDAS
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  data_venda TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  cliente_id TEXT,
  cliente_nome TEXT NOT NULL DEFAULT 'Cliente Não Informado',
  status_inicial TEXT DEFAULT 'Rascunho',
  previsao_entrega DATE,
  status_envio TEXT DEFAULT 'Não enviado', -- 'Não enviado' ou 'Entregue'
  valor_total NUMERIC DEFAULT 0,
  observacoes TEXT,
  user_id UUID
);

ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS data_venda TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS cliente_id TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS status_inicial TEXT DEFAULT 'Rascunho';
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS previsao_entrega DATE;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS status_envio TEXT DEFAULT 'Não enviado';
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor_total NUMERIC DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. PERMISSÕES E POLÍTICAS RLS (RESOLVE O "operation not permitted")
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.estoque TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.vendas TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Permissao_Total_Estoque" ON public.estoque;
CREATE POLICY "Permissao_Total_Estoque" ON public.estoque FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_Total_Vendas" ON public.vendas;
CREATE POLICY "Permissao_Total_Vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);

-- Caso exista a tabela bm_inventory, garantir mesmas permissões
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bm_inventory') THEN
    ALTER TABLE public.bm_inventory ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.bm_inventory TO anon, authenticated, service_role;
    DROP POLICY IF EXISTS "Permissao_Total_Bm_Inventory" ON public.bm_inventory;
    CREATE POLICY "Permissao_Total_Bm_Inventory" ON public.bm_inventory FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. RECARREGAMENTO FORÇADO DO SCHEMA CACHE NO POSTGREST
NOTIFY pgrst, 'reload schema';
