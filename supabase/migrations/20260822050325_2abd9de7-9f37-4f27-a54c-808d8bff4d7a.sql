INSERT INTO public.equipe_membros (empresa_id, nome, email, cargo, papel, status, status_senha) 
SELECT id, 'Francille', 'francille@empresa.com', 'Produção de Contas', 'funcionario', 'ativo', 'pendente'
FROM public.empresas 
LIMIT 1;