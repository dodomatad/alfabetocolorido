
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'logs_acesso' AND column_name = 'usuario_email') THEN
        ALTER TABLE public.logs_acesso ADD COLUMN usuario_email TEXT;
    END IF;
END $$;

GRANT ALL ON public.logs_acesso TO authenticated;
GRANT ALL ON public.logs_acesso TO service_role;

ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver logs da própria empresa" ON public.logs_acesso;
CREATE POLICY "Usuários podem ver logs da própria empresa"
ON public.logs_acesso
FOR SELECT
TO authenticated
USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar logs" ON public.logs_acesso;
CREATE POLICY "Admins podem gerenciar logs"
ON public.logs_acesso
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));
