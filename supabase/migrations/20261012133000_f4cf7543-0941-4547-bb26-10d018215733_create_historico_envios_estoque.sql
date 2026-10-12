-- Migration: 20261012133000_f4cf7543-0941-4547-bb26-10d018215733_create_historico_envios_estoque.sql

-- 1. Criar tabela historico_envios_estoque
CREATE TABLE IF NOT EXISTS public.historico_envios_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    conta_id UUID REFERENCES public.estoque(id) ON DELETE SET NULL,
    venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
    nome_conta TEXT NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nome TEXT NOT NULL,
    valor_venda NUMERIC(10,2) DEFAULT 0.00,
    status_entrega TEXT NOT NULL DEFAULT 'entregue',
    data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS e conceder privilégios
ALTER TABLE public.historico_envios_estoque ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_envios_estoque TO authenticated;
GRANT ALL ON public.historico_envios_estoque TO service_role;

DROP POLICY IF EXISTS "Gerenciar historico_envios_estoque para mesma empresa" ON public.historico_envios_estoque;
CREATE POLICY "Gerenciar historico_envios_estoque para mesma empresa"
ON public.historico_envios_estoque FOR ALL
TO authenticated
USING (empresa_id = internal.empresa_atual())
WITH CHECK (empresa_id = internal.empresa_atual());

-- 3. Adicionar coluna conta_id / bm_id na tabela venda_itens caso não exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'venda_itens' AND column_name = 'conta_id') THEN
        ALTER TABLE public.venda_itens ADD COLUMN conta_id UUID REFERENCES public.estoque(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';
