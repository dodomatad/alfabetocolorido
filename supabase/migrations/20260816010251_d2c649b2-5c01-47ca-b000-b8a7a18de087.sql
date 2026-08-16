-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('administrador','gestor','financeiro','supervisor_producao','funcionario','visualizacao');
CREATE TYPE public.venda_status AS ENUM ('rascunho','confirmada','em_producao','pronta','parcialmente_entregue','entregue','cancelada');

-- ============ UTIL ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ EMPRESAS ============
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  logo_url text,
  fuso_horario text NOT NULL DEFAULT 'America/Sao_Paulo',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- ============ PERFIS ============
CREATE TABLE public.perfis (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  cargo text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_perfis_empresa ON public.perfis(empresa_id);
GRANT SELECT, INSERT, UPDATE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- ============ PAPEIS ============
CREATE TABLE public.papeis_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome public.app_role NOT NULL UNIQUE,
  descricao text NOT NULL
);
GRANT SELECT ON public.papeis_usuario TO authenticated;
GRANT ALL ON public.papeis_usuario TO service_role;
ALTER TABLE public.papeis_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "papeis_leitura" ON public.papeis_usuario FOR SELECT TO authenticated USING (true);

INSERT INTO public.papeis_usuario (nome, descricao) VALUES
 ('administrador','Administra empresa, usuarios, configuracoes, vendas, producao, estoque e financeiro'),
 ('gestor','Opera vendas, clientes, fornecedores, producao, estoque e relatorios'),
 ('financeiro','Opera contas a receber, contas a pagar, lancamentos e relatorios financeiros'),
 ('supervisor_producao','Cria ordens, distribui producao, aprova apontamentos e consulta estoque'),
 ('funcionario','Consulta somente suas ordens e registra sua propria producao'),
 ('visualizacao','Consulta somente as telas liberadas, sem criar ou alterar registros');

CREATE TABLE public.usuarios_papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel public.app_role NOT NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, papel, empresa_id)
);
CREATE INDEX idx_usuarios_papeis_usuario ON public.usuarios_papeis(usuario_id);
GRANT SELECT, INSERT, DELETE ON public.usuarios_papeis TO authenticated;
GRANT ALL ON public.usuarios_papeis TO service_role;
ALTER TABLE public.usuarios_papeis ENABLE ROW LEVEL SECURITY;

-- ============ FUNCOES SEGURAS ============
CREATE OR REPLACE FUNCTION public.empresa_atual()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT empresa_id FROM public.perfis WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios_papeis WHERE usuario_id = _user_id AND papel = _role);
$$;

CREATE OR REPLACE FUNCTION public.pode_gerenciar()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'gestor');
$$;

-- policies dependentes
CREATE POLICY "empresas_leitura" ON public.empresas FOR SELECT TO authenticated USING (id = public.empresa_atual());
CREATE POLICY "empresas_criar" ON public.empresas FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "empresas_editar" ON public.empresas FOR UPDATE TO authenticated
  USING (id = public.empresa_atual() AND public.has_role(auth.uid(),'administrador'))
  WITH CHECK (id = public.empresa_atual());

CREATE POLICY "perfis_ver_proprio" ON public.perfis FOR SELECT TO authenticated
  USING (id = auth.uid() OR empresa_id = public.empresa_atual());
CREATE POLICY "perfis_criar_proprio" ON public.perfis FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "perfis_editar" ON public.perfis FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (empresa_id = public.empresa_atual() AND public.has_role(auth.uid(),'administrador')))
  WITH CHECK (id = auth.uid() OR (empresa_id = public.empresa_atual() AND public.has_role(auth.uid(),'administrador')));

CREATE POLICY "usuarios_papeis_leitura" ON public.usuarios_papeis FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR empresa_id = public.empresa_atual());
CREATE POLICY "usuarios_papeis_admin_insert" ON public.usuarios_papeis FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_atual() AND public.has_role(auth.uid(),'administrador'));
CREATE POLICY "usuarios_papeis_admin_delete" ON public.usuarios_papeis FOR DELETE TO authenticated
  USING (empresa_id = public.empresa_atual() AND public.has_role(auth.uid(),'administrador'));

-- ============ AUDITORIA ============
CREATE TABLE public.auditoria_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id uuid,
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  dados_anteriores jsonb,
  dados_novos jsonb,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_empresa_data ON public.auditoria_eventos(empresa_id, created_at DESC);
GRANT SELECT, INSERT ON public.auditoria_eventos TO authenticated;
GRANT ALL ON public.auditoria_eventos TO service_role;
ALTER TABLE public.auditoria_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditoria_leitura" ON public.auditoria_eventos FOR SELECT TO authenticated
  USING (empresa_id = public.empresa_atual() AND (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'gestor')));
CREATE POLICY "auditoria_insercao" ON public.auditoria_eventos FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.empresa_atual() AND usuario_id = auth.uid());

CREATE OR REPLACE FUNCTION public.registrar_auditoria()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_empresa uuid;
BEGIN
  v_empresa := COALESCE(
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE (to_jsonb(NEW) ->> 'empresa_id')::uuid END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE (to_jsonb(OLD) ->> 'empresa_id')::uuid END
  );
  INSERT INTO public.auditoria_eventos (empresa_id, usuario_id, entidade, entidade_id, acao, dados_anteriores, dados_novos)
  VALUES (
    v_empresa, auth.uid(), TG_TABLE_NAME,
    COALESCE((to_jsonb(COALESCE(NEW, OLD)) ->> 'id')::uuid, NULL),
    lower(TG_OP),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

-- ============ CLIENTES ============
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (length(btrim(nome)) > 0),
  documento text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_empresa ON public.clientes(empresa_id);
CREATE UNIQUE INDEX uq_clientes_doc ON public.clientes(empresa_id, documento) WHERE documento IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_leitura" ON public.clientes FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY "clientes_criar" ON public.clientes FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY "clientes_editar" ON public.clientes FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());

-- ============ FORNECEDORES ============
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (length(btrim(nome)) > 0),
  documento text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fornecedores_empresa ON public.fornecedores(empresa_id);
CREATE UNIQUE INDEX uq_fornecedores_doc ON public.fornecedores(empresa_id, documento) WHERE documento IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_leitura" ON public.fornecedores FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY "fornecedores_criar" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY "fornecedores_editar" ON public.fornecedores FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());

-- ============ MODALIDADES ============
CREATE TABLE public.modalidades_bm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (length(btrim(nome)) > 0),
  codigo text NOT NULL,
  descricao text,
  preco_venda_padrao numeric(14,2) NOT NULL DEFAULT 0 CHECK (preco_venda_padrao >= 0),
  custo_producao_padrao numeric(14,2) NOT NULL DEFAULT 0 CHECK (custo_producao_padrao >= 0),
  valor_pagamento_unidade numeric(14,2) NOT NULL DEFAULT 0 CHECK (valor_pagamento_unidade >= 0),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, codigo)
);
GRANT SELECT, INSERT, UPDATE ON public.modalidades_bm TO authenticated;
GRANT ALL ON public.modalidades_bm TO service_role;
ALTER TABLE public.modalidades_bm ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modalidades_leitura" ON public.modalidades_bm FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY "modalidades_criar" ON public.modalidades_bm FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY "modalidades_editar" ON public.modalidades_bm FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());

-- ============ VENDAS ============
CREATE TABLE public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE RESTRICT,
  numero integer NOT NULL,
  data_venda date NOT NULL DEFAULT current_date,
  data_entrega_prevista date,
  status public.venda_status NOT NULL DEFAULT 'rascunho',
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  desconto numeric(14,2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  acrescimo numeric(14,2) NOT NULL DEFAULT 0 CHECK (acrescimo >= 0),
  valor_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (valor_total >= 0),
  observacoes text,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, numero)
);
CREATE INDEX idx_vendas_empresa_data ON public.vendas(empresa_id, data_venda DESC);
GRANT SELECT, INSERT, UPDATE ON public.vendas TO authenticated;
GRANT ALL ON public.vendas TO service_role;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendas_leitura" ON public.vendas FOR SELECT TO authenticated USING (empresa_id = public.empresa_atual());
CREATE POLICY "vendas_criar" ON public.vendas FOR INSERT TO authenticated WITH CHECK (empresa_id = public.empresa_atual() AND public.pode_gerenciar());
CREATE POLICY "vendas_editar" ON public.vendas FOR UPDATE TO authenticated USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar()) WITH CHECK (empresa_id = public.empresa_atual());

CREATE TABLE public.venda_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  modalidade_id uuid REFERENCES public.modalidades_bm(id) ON DELETE RESTRICT,
  quantidade numeric(14,2) NOT NULL CHECK (quantidade > 0),
  preco_unitario numeric(14,2) NOT NULL CHECK (preco_unitario >= 0),
  desconto numeric(14,2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  valor_total numeric(14,2) NOT NULL CHECK (valor_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_venda_itens_venda ON public.venda_itens(venda_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venda_itens TO authenticated;
GRANT ALL ON public.venda_itens TO service_role;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venda_itens_leitura" ON public.venda_itens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.empresa_id = public.empresa_atual()));
CREATE POLICY "venda_itens_escrita" ON public.venda_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.empresa_id = public.empresa_atual()) AND public.pode_gerenciar())
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.empresa_id = public.empresa_atual()) AND public.pode_gerenciar());

-- ============ TRIGGERS ============
CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_perfis_updated BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_fornecedores_updated BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_modalidades_updated BEFORE UPDATE ON public.modalidades_bm FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vendas_updated BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_aud_clientes AFTER INSERT OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_fornecedores AFTER INSERT OR UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_modalidades AFTER INSERT OR UPDATE ON public.modalidades_bm FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_vendas AFTER INSERT OR UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- ============ ONBOARDING ============
CREATE OR REPLACE FUNCTION public.criar_empresa_inicial(
  _razao_social text, _nome_fantasia text DEFAULT NULL, _cnpj text DEFAULT NULL,
  _nome_usuario text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_empresa uuid; v_user uuid := auth.uid(); v_email text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.perfis WHERE id = v_user AND empresa_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Usuario ja possui empresa';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_user;
  INSERT INTO public.empresas (razao_social, nome_fantasia, cnpj) VALUES (_razao_social, _nome_fantasia, _cnpj)
  RETURNING id INTO v_empresa;
  INSERT INTO public.perfis (id, empresa_id, nome, email, cargo)
  VALUES (v_user, v_empresa, COALESCE(NULLIF(btrim(_nome_usuario),''), v_email, 'Usuario'), v_email, 'Administrador')
  ON CONFLICT (id) DO UPDATE SET empresa_id = EXCLUDED.empresa_id, nome = EXCLUDED.nome;
  INSERT INTO public.usuarios_papeis (usuario_id, papel, empresa_id) VALUES (v_user, 'administrador', v_empresa);
  INSERT INTO public.auditoria_eventos (empresa_id, usuario_id, entidade, entidade_id, acao)
  VALUES (v_empresa, v_user, 'empresas', v_empresa, 'criacao_inicial');
  RETURN v_empresa;
END; $$;
REVOKE ALL ON FUNCTION public.criar_empresa_inicial(text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.criar_empresa_inicial(text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.proximo_numero_venda(_empresa uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(MAX(numero),0) + 1 FROM public.vendas WHERE empresa_id = _empresa;
$$;