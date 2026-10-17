-- Adiciona colunas de compatibilidade na tabela estoque
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS limite TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS criador_responsavel TEXT;
