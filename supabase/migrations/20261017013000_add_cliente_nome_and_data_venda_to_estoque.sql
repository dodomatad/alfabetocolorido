-- Adiciona cliente_nome e data_venda na tabela estoque para rastreamento de ativos vendidos
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS data_venda DATE;
