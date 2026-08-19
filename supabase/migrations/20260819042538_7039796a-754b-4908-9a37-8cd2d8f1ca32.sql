-- Revogar acesso público e restringir permissões para as novas funções trigger
REVOKE ALL ON FUNCTION public.handle_sync_venda_para_entrega() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_sync_entrega_para_venda() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.handle_sync_venda_para_entrega() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_sync_venda_para_entrega() TO service_role;

GRANT EXECUTE ON FUNCTION public.handle_sync_entrega_para_venda() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_sync_entrega_para_venda() TO service_role;

-- Comentário para segurança: o search_path já foi definido na criação da função.
