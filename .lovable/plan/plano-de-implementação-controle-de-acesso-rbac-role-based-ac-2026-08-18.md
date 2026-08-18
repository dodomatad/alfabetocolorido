# Plano de Implementação: Controle de Acesso RBAC (Role-Based Access Control)

Implementação rigorosa do sistema de permissões customizadas para colaboradores, garantindo segurança no frontend e backend.

## 1. Persistência de Dados e Banco de Dados (Supabase)
- **RLS (Row Level Security):** Atualizar as políticas de RLS para que todas as tabelas sensíveis (`lancamentos_financeiros`, `venda_itens`, `logs_acesso`, `producao_diaria`) validem se o usuário tem a permissão necessária via a tabela `permissoes_acesso`.
- **Função de Segurança:** Criar/ajustar funções `security definer` para checar permissões específicas sem recursividade no RLS.

## 2. Frontend: Gestão de Estado e Sessão
- **useSessao:** Otimizar o hook para carregar todas as permissões no login e fornecer métodos auxiliares como `temPermissao(modulo, acao)`.
- **Gate de Rota (Route Guard):** Atualizar o `beforeLoad` no arquivo `src/routes/_authenticated/route.tsx` para interceptar acessos diretos via URL e redirecionar para `/` caso o usuário não tenha a permissão `pode_visualizar`.

## 3. Frontend: Interface Dinâmica (Sidebar e Dashboard)
- **Menu Lateral:** Ocultar itens do menu (`GRUPOS_MENU`) baseando-se no retorno de `temPermissao`.
- **Dashboard:** Implementar lógica no `index.tsx` para ocultar/mascarar métricas financeiras se a flag `ocultar_valores` estiver ativa para o módulo `dashboard`.
- **Financeiro:** Garantir que a flag `ocultar_valores` do módulo `financeiro` mascare os dados na tela de lançamentos.

## 4. Segurança de Componentes Reutilizáveis
- **CabecalhoPagina:** Integrar verificação de permissão no cabeçalho para esconder botões de ação ("Adicionar", "Excluir") dinamicamente.
- **ModuloRegistros:** Adicionar validações internas para impedir operações de CRUD se o usuário não tiver permissão de `pode_criar`, `pode_editar` ou `pode_excluir`.

## Detalhes Técnicos
- **Tabela de referência:** `permissoes_acesso` (usuario_id, modulo, pode_visualizar, pode_criar, pode_editar, pode_excluir, ocultar_valores).
- **Módulos:** dashboard, vendas, producao, estoque, entregas, financeiro, clientes, fornecedores, equipe, relatorios, configuracoes.
- **Mascaramento:** Uso de `***` para valores monetários quando `ocultar_valores` for verdadeiro.
