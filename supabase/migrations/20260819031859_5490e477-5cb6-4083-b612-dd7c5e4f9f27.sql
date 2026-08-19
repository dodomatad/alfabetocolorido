-- Re-criação da tabela de reposições com handle_updated_at omitido se não existir
-- mas vou primeiro verificar se a função existe ou criar uma genérica se faltar.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criação da tabela de reposições (garantias)
CREATE TABLE IF NOT EXISTS public.reposicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    modalidade_id UUID NOT NULL REFERENCES public.modalidades_bm(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 1,
    data_reposicao DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo TEXT,
    status TEXT NOT NULL DEFAULT 'concluida' CHECK (status IN ('pendente', 'concluida', 'cancelada')),
    observacoes TEXT,
    criado_por UUID REFERENCES auth.users(id),
    atualizado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.reposicoes ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reposicoes TO authenticated;
GRANT ALL ON public.reposicoes TO service_role;

-- Políticas de RLS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reposicoes' AND policyname = 'Isolamento por empresa - SELECT') THEN
        CREATE POLICY "Isolamento por empresa - SELECT" ON public.reposicoes FOR SELECT TO authenticated USING (empresa_id = internal.empresa_atual());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reposicoes' AND policyname = 'Isolamento por empresa - INSERT') THEN
        CREATE POLICY "Isolamento por empresa - INSERT" ON public.reposicoes FOR INSERT TO authenticated WITH CHECK (empresa_id = internal.empresa_atual());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reposicoes' AND policyname = 'Isolamento por empresa - UPDATE') THEN
        CREATE POLICY "Isolamento por empresa - UPDATE" ON public.reposicoes FOR UPDATE TO authenticated USING (empresa_id = internal.empresa_atual());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reposicoes' AND policyname = 'Isolamento por empresa - DELETE') THEN
        CREATE POLICY "Isolamento por empresa - DELETE" ON public.reposicoes FOR DELETE TO authenticated USING (empresa_id = internal.empresa_atual());
    END IF;
END $$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_updated_at_reposicoes ON public.reposicoes;
CREATE TRIGGER set_updated_at_reposicoes
    BEFORE UPDATE ON public.reposicoes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Comentários
COMMENT ON TABLE public.reposicoes IS 'Registros de reposição de perfis/BMs em garantia.';
