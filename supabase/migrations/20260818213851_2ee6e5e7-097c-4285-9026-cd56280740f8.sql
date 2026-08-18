-- 1. Refinar a função proximo_numero_venda para respeitar o isolamento por empresa_id
-- O isolamento é garantido porque a tabela vendas tem RLS e a função usa a empresa_atual()
CREATE OR REPLACE FUNCTION public.proximo_numero_venda()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, pg_temp
AS $$ 
DECLARE 
    proximo_num INTEGER; 
BEGIN 
    SELECT COALESCE(MAX(numero_venda), 0) + 1 
    INTO proximo_num 
    FROM public.vendas
    WHERE empresa_id = internal.empresa_atual();
    
    RETURN proximo_num; 
END; 
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_venda() TO authenticated, service_role;

-- 2. Corrigir permissão de visualização para tabelas críticas no primeiro acesso
-- Garante que o usuário consiga ver sua própria empresa e perfil logo após o onboarding
GRANT SELECT ON public.empresas TO authenticated;
GRANT SELECT ON public.perfis TO authenticated;
GRANT SELECT ON public.usuarios_papeis TO authenticated;
GRANT SELECT ON public.permissoes_acesso TO authenticated;
