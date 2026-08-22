ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS responsavel_producao_id UUID REFERENCES public.perfis(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(5,2) DEFAULT 0;

COMMENT ON COLUMN public.vendas.responsavel_producao_id IS 'Funcionária responsável pela produção das contas desta venda';
COMMENT ON COLUMN public.vendas.comissao_percentual IS 'Percentual de comissão acordado para a funcionária nesta venda';
