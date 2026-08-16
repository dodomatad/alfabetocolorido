-- ENUMS
CREATE TYPE public.producao_status AS ENUM ('planejada','em_producao','pausada','concluida','cancelada');
CREATE TYPE public.entrega_status AS ENUM ('pendente','em_rota','entregue','falhou','cancelada');
CREATE TYPE public.financeiro_tipo AS ENUM ('receber','pagar');
CREATE TYPE public.financeiro_situacao AS ENUM ('aberto','parcial','pago','atrasado','cancelado');

-- ORDENS DE PRODUCAO
CREATE TABLE public.ordens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  venda_id uuid REFERENCES public.vendas(id),
  modalidade_id uuid REFERENCES public.modalidades_bm(id),
  descricao text NOT NULL,
  quantidade numeric(14,2) NOT NULL DEFAULT 0,
  quantidade_concluida numeric(14,2) NOT NULL DEFAULT 0,
  responsavel text,
  data_inicio date,
  data_prazo date,
  status producao_status NOT NULL DEFAULT 'planejada',
  observacoes text,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ordens_producao TO authenticated;
GRANT ALL ON public.ordens_producao TO service_role;
ALTER TABLE public.ordens_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY ordens_leitura ON public.ordens_producao FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY ordens_criar ON public.ordens_producao FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY ordens_editar ON public.ordens_producao FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());
CREATE TRIGGER trg_ordens_updated BEFORE UPDATE ON public.ordens_producao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_aud_ordens AFTER INSERT OR UPDATE ON public.ordens_producao FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- ITENS DE ESTOQUE
CREATE TABLE public.itens_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  nome text NOT NULL,
  codigo text,
  unidade text NOT NULL DEFAULT 'un',
  quantidade_atual numeric(14,2) NOT NULL DEFAULT 0,
  quantidade_minima numeric(14,2) NOT NULL DEFAULT 0,
  custo_unitario numeric(14,2) NOT NULL DEFAULT 0,
  localizacao text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.itens_estoque TO authenticated;
GRANT ALL ON public.itens_estoque TO service_role;
ALTER TABLE public.itens_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY estoque_leitura ON public.itens_estoque FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY estoque_criar ON public.itens_estoque FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY estoque_editar ON public.itens_estoque FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());
CREATE TRIGGER trg_estoque_updated BEFORE UPDATE ON public.itens_estoque FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_aud_estoque AFTER INSERT OR UPDATE ON public.itens_estoque FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- ENTREGAS
CREATE TABLE public.entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  venda_id uuid REFERENCES public.vendas(id),
  cliente_id uuid REFERENCES public.clientes(id),
  destinatario text,
  endereco text,
  data_prevista date,
  data_realizada date,
  transportadora text,
  status entrega_status NOT NULL DEFAULT 'pendente',
  observacoes text,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.entregas TO authenticated;
GRANT ALL ON public.entregas TO service_role;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
CREATE POLICY entregas_leitura ON public.entregas FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY entregas_criar ON public.entregas FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY entregas_editar ON public.entregas FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());
CREATE TRIGGER trg_entregas_updated BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_aud_entregas AFTER INSERT OR UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- LANCAMENTOS FINANCEIROS
CREATE TABLE public.lancamentos_financeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  tipo financeiro_tipo NOT NULL,
  descricao text NOT NULL,
  categoria text,
  cliente_id uuid REFERENCES public.clientes(id),
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  venda_id uuid REFERENCES public.vendas(id),
  valor numeric(14,2) NOT NULL DEFAULT 0,
  valor_pago numeric(14,2) NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento date,
  forma_pagamento text,
  situacao financeiro_situacao NOT NULL DEFAULT 'aberto',
  observacoes text,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.lancamentos_financeiros TO authenticated;
GRANT ALL ON public.lancamentos_financeiros TO service_role;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY financeiro_leitura ON public.lancamentos_financeiros FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY financeiro_criar ON public.lancamentos_financeiros FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY financeiro_editar ON public.lancamentos_financeiros FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());
CREATE TRIGGER trg_financeiro_updated BEFORE UPDATE ON public.lancamentos_financeiros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_aud_financeiro AFTER INSERT OR UPDATE ON public.lancamentos_financeiros FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

CREATE INDEX idx_ordens_empresa ON public.ordens_producao(empresa_id, status);
CREATE INDEX idx_estoque_empresa ON public.itens_estoque(empresa_id, ativo);
CREATE INDEX idx_entregas_empresa ON public.entregas(empresa_id, status);
CREATE INDEX idx_financeiro_empresa ON public.lancamentos_financeiros(empresa_id, tipo, situacao);