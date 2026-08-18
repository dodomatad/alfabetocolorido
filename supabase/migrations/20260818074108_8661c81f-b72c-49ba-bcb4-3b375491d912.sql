-- 1. Habilitar RLS na tabela equipe_membros
ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas ou conflitantes
DROP POLICY IF EXISTS "Permitir leitura de equipe_membros para autenticados" ON public.equipe_membros;
DROP POLICY IF EXISTS "Permitir inserção de equipe_membros para autenticados" ON public.equipe_membros;
DROP POLICY IF EXISTS "Permitir atualização de equipe_membros para autenticados" ON public.equipe_membros;
DROP POLICY IF EXISTS "Permitir exclusão de equipe_membros para autenticados" ON public.equipe_membros;
DROP POLICY IF EXISTS "equipe_membros_all_policy" ON public.equipe_membros;

-- 3. Criar política universal permissiva para leitura/escrita de membros da equipe
CREATE POLICY "Permitir gerenciamento total de equipe_membros para autenticados"
ON public.equipe_membros
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Permitir inserção pública caso o cadastro ocorra antes da confirmação de sessão (opcional/seguro)
CREATE POLICY "Permitir cadastro via anon/onboarding"
ON public.equipe_membros
FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Recarregar cache de schema
NOTIFY pgrst, 'reload schema';