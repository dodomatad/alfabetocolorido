# Plano de Correção e Segurança do Sistema

Este plano aborda a correção definitiva dos 4 pontos críticos identificados na auditoria técnica, garantindo isolamento total de multi-tenancy (RLS), atomicidade no cadastro e consolidação das funções de segurança.

## Etapa 1: Consolidação das Funções de Segurança
Limpeza de funções duplicadas e recriação de versões seguras com `SECURITY DEFINER` e `search_path` restrito.

- Remover `public.has_role(TEXT)`, `public.has_role(UUID, TEXT)`, `internal.has_role(UUID, TEXT)`, `internal.pode_gerenciar()` e `public.pode_gerenciar()`.
- Criar `public.has_role(_user_id UUID, _role TEXT)` robusta.
- Criar `internal.empresa_atual()` à prova de falhas (retorna UUID zero em caso de erro para evitar bypass de RLS).

## Etapa 2: Garantia de Multi-tenancy (RLS)
Revisão de todas as políticas de RLS para garantir que o isolamento por `empresa_id` seja absoluto e não contornável.

- Ajustar as políticas nas tabelas `perfis`, `clientes`, `fornecedores`, `vendas`, `venda_itens`, `itens_estoque`, `ordens_producao`, `entregas`, `lancamentos_financeiros`, `logs_acesso`, `usuarios_papeis`, `permissoes_acesso` e `producao_diaria`.
- Substituir filtros manuais por chamadas a `internal.empresa_atual()`.

## Etapa 3: Atomicidade no Cadastro (Onboarding)
Ajuste da função `onboarding_novo_usuario` para garantir que a criação da empresa, do perfil e dos papéis administrativos ocorra em uma única transação atômica, evitando estados inconsistentes.

## Etapa 4: Limpeza e Otimização
Remoção de tabelas legadas e ajuste de permissões finais.

- Garantir que a tabela `usuarios_papeis` seja a única fonte de verdade para RBAC.
- Revogar permissões desnecessárias de execução para usuários anônimos.

## Detalhes Técnicos
- Uso de `plpgsql` para funções de banco de dados.
- Aplicação de `GRANT EXECUTE` específico para `authenticated` e `service_role`.
- Padronização do `search_path` para prevenir ataques de busca de caminho.
