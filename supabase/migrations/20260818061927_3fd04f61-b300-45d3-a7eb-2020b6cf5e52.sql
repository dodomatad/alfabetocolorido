CREATE TABLE IF NOT EXISTS public.logs_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_nome TEXT NOT NULL,
    usuario_email TEXT,
    dispositivo TEXT NOT NULL,
    ip TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.logs_acesso TO authenticated;
GRANT ALL ON public.logs_acesso TO service_role;

-- Enable RLS
ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;

-- Policies for logs_acesso
DROP POLICY IF EXISTS "Permitir gestão de logs por empresa" ON public.logs_acesso;
CREATE POLICY "Permitir gestão de logs por empresa"
ON public.logs_acesso
FOR ALL
TO authenticated
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
  )
)
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
  )
);
