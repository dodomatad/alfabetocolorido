-- 1. Limpeza e Isolamento de equipe_membros
DROP POLICY IF EXISTS "Admins podem gerenciar equipe da empresa" ON public.equipe_membros;
DROP POLICY IF EXISTS "Gerenciar equipe_membros para autenticados" ON public.equipe_membros;
DROP POLICY IF EXISTS "Membros podem ver outros membros da mesma empresa" ON public.equipe_membros;
DROP POLICY IF EXISTS "Permitir cadastro via anon/onboarding" ON public.equipe_membros;
DROP POLICY IF EXISTS "Permitir gerenciamento total de equipe_membros para autenticado" ON public.equipe_membros;

CREATE POLICY "equipe_membros_isolamento" ON public.equipe_membros
    FOR ALL TO authenticated
    USING (empresa_id = internal.empresa_atual())
    WITH CHECK (empresa_id = internal.empresa_atual());

-- 2. Limpeza e Isolamento de logs_acesso
DROP POLICY IF EXISTS "Admins podem gerenciar logs" ON public.logs_acesso;
-- MANTER: "Inserir logs anonimos para registrar falha" (é essencial para o login)
DROP POLICY IF EXISTS "Inserir logs para autenticados" ON public.logs_acesso;
DROP POLICY IF EXISTS "Permitir tudo para membros da empresa" ON public.logs_acesso;
DROP POLICY IF EXISTS "Usuários podem ver logs da própria empresa" ON public.logs_acesso;
DROP POLICY IF EXISTS "Usuários podem ver logs da sua empresa se tiverem permissão" ON public.logs_acesso;
DROP POLICY IF EXISTS "Visualizar logs_acesso para autenticados" ON public.logs_acesso;
DROP POLICY IF EXISTS "logs_acesso_isolamento" ON public.logs_acesso;

CREATE POLICY "logs_acesso_isolamento" ON public.logs_acesso
    FOR SELECT TO authenticated
    USING (empresa_id = internal.empresa_atual());

CREATE POLICY "logs_acesso_insert_autenticado" ON public.logs_acesso
    FOR INSERT TO authenticated
    WITH CHECK (empresa_id = internal.empresa_atual());
