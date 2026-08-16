CREATE TYPE public.motivo_queda AS ENUM ('erro_cartao','checkpoint_identidade','bloqueio_ip','restricao_imediata','outros');

CREATE TABLE public.producao_diaria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  data_registro date NOT NULL DEFAULT current_date,
  operador text NOT NULL,
  operador_id uuid,
  bms_criadas integer NOT NULL DEFAULT 0,
  bms_aquecidas integer NOT NULL DEFAULT 0,
  contas_subidas integer NOT NULL DEFAULT 0,
  contas_viradas integer NOT NULL DEFAULT 0,
  bloqueios integer NOT NULL DEFAULT 0,
  motivo_queda public.motivo_queda,
  meta_diaria integer NOT NULL DEFAULT 10,
  observacoes text,
  criado_por uuid,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.producao_diaria TO authenticated;
GRANT ALL ON public.producao_diaria TO service_role;

ALTER TABLE public.producao_diaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "producao_diaria_select" ON public.producao_diaria FOR SELECT TO authenticated
USING (empresa_id = public.empresa_atual());
CREATE POLICY "producao_diaria_insert" ON public.producao_diaria FOR INSERT TO authenticated
WITH CHECK (empresa_id = public.empresa_atual());
CREATE POLICY "producao_diaria_update" ON public.producao_diaria FOR UPDATE TO authenticated
USING (empresa_id = public.empresa_atual()) WITH CHECK (empresa_id = public.empresa_atual());
CREATE POLICY "producao_diaria_delete" ON public.producao_diaria FOR DELETE TO authenticated
USING (empresa_id = public.empresa_atual() AND public.pode_gerenciar());

CREATE TRIGGER trg_producao_diaria_updated BEFORE UPDATE ON public.producao_diaria
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_aud_producao_diaria AFTER INSERT OR UPDATE ON public.producao_diaria
FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();