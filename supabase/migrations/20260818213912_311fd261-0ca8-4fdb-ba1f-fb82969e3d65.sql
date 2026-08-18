-- 1. Fortalecer as políticas de RLS para tabelas dependentes
-- Venda Itens (Join com Vendas)
DROP POLICY IF EXISTS "venda_itens_isolamento" ON public.venda_itens;
CREATE POLICY "venda_itens_isolamento" ON public.venda_itens
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.vendas v WHERE v.id = venda_id AND v.empresa_id = internal.empresa_atual()));

-- 2. Garantir que o linter não aponte vulnerabilidades básicas em novas tabelas
-- Caso a tabela auditoria_eventos tenha sido criada sem RLS
ALTER TABLE public.auditoria_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auditoria_isolamento" ON public.auditoria_eventos;
CREATE POLICY "auditoria_isolamento" ON public.auditoria_eventos
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual());

-- 3. Grants para a tabela de logs de acesso (usada no login)
GRANT INSERT, SELECT ON public.logs_acesso TO authenticated;
GRANT ALL ON public.logs_acesso TO service_role;
ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_acesso_isolamento" ON public.logs_acesso;
CREATE POLICY "logs_acesso_isolamento" ON public.logs_acesso
    FOR ALL TO authenticated USING (empresa_id = internal.empresa_atual() OR usuario_id = auth.uid());
