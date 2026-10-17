-- Adiciona nome_portfolio e nome_conta para identificação detalhada dos ativos de BMs
ALTER TABLE estoque ADD COLUMN IF NOT EXISTS nome_portfolio TEXT;
ALTER TABLE estoque ADD COLUMN IF NOT EXISTS nome_conta TEXT;

ALTER TABLE producao_diaria ADD COLUMN IF NOT EXISTS nome_portfolio TEXT;
ALTER TABLE producao_diaria ADD COLUMN IF NOT EXISTS nome_conta TEXT;

CREATE INDEX IF NOT EXISTS idx_estoque_portfolio ON estoque(empresa_id, nome_portfolio);
CREATE INDEX IF NOT EXISTS idx_estoque_conta ON estoque(empresa_id, nome_conta);
