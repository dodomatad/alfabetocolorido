-- 1. Criar ou atualizar a tabela estoque com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  data_registro DATE DEFAULT CURRENT_DATE,
  nome TEXT NOT NULL DEFAULT 'BM Sem Nome',
  nome_portfolio TEXT,
  nome_conta TEXT,
  limite TEXT DEFAULT 'BM 250',
  tipo_ativo TEXT DEFAULT 'BM',
  template BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Disponível',
  criador_responsavel TEXT,
  destinatario_cliente TEXT,
  quantidade INTEGER DEFAULT 1,
  custo_unitario NUMERIC DEFAULT 0,
  origem TEXT DEFAULT 'producao',
  producao_id UUID,
  venda_id UUID,
  cliente_id UUID,
  cliente_nome TEXT,
  observacoes TEXT,
  user_id UUID
);

-- 2. Garantir cada coluna individual caso a tabela já exista:
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS limite TEXT DEFAULT 'BM 250';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome_portfolio TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome_conta TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome TEXT DEFAULT 'BM Sem Nome';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS data_registro DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS tipo_ativo TEXT DEFAULT 'BM';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS template BOOLEAN DEFAULT false;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Disponível';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS criador_responsavel TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS destinatario_cliente TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 1;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC DEFAULT 0;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'producao';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS producao_id UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS venda_id UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS cliente_id UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS user_id UUID;

-- Colunas legadas para retrocompatibilidade
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome_bm TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS limite_bm TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS destinatario TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS status_envio TEXT DEFAULT 'disponivel';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS tem_template BOOLEAN DEFAULT false;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade_disponivel REAL DEFAULT 1;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade_reservada REAL DEFAULT 0;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS custo_medio_unitario REAL DEFAULT 0;

-- 3. Remover restrições de unicidade que geram duplicate key
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS uq_estoque_empresa_tipo;

-- 4. Permissões de RLS totais para leitura, gravação e deleção
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.estoque TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Acesso_Total_Estoque" ON public.estoque;
CREATE POLICY "Acesso_Total_Estoque" ON public.estoque FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissao_Total_Estoque" ON public.estoque;
CREATE POLICY "Permissao_Total_Estoque" ON public.estoque FOR ALL USING (true) WITH CHECK (true);

-- 5. RECARREGAR O SCHEMA CACHE DO POSTGREST IMEDIATAMENTE (CRÍTICO)
NOTIFY pgrst, 'reload schema';
