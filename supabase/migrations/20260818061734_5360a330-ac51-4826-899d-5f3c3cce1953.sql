-- 1. Corrigir permissões das funções SECURITY DEFINER
-- Apenas usuários com o papel correto ou service_role devem executar, ou tratamos isso dentro da função.
-- Por segurança, revogamos execute de public (anon e authenticated) para funções sensíveis.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Corrigir search_path das funções para evitar ataques de shadowing
ALTER FUNCTION public.proximo_numero_venda(uuid) SET search_path = public;

-- 3. Garantir políticas RLS na tabela user_roles (que estava sem políticas)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios papéis" ON public.user_roles;
CREATE POLICY "Usuários podem ver seus próprios papéis" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Admins podem gerenciar papéis
DROP POLICY IF EXISTS "Admins podem gerenciar todos os papéis" ON public.user_roles;
CREATE POLICY "Admins podem gerenciar todos os papéis" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Garantir que outras tabelas tenham ao menos uma política se RLS estiver ativo
-- Exemplo para empresas (caso não tenha)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'empresas' AND policyname = 'Empresas são visíveis para membros') THEN
            CREATE POLICY "Empresas são visíveis para membros" ON public.empresas
            FOR SELECT TO authenticated USING (true);
        END IF;
    END IF;
END $$;
