# Plano de Sincronização Automática: Vendas e Entregas

Implementar a sincronização bidirecional em tempo real entre os módulos de Vendas e Entregas, garantindo que toda venda gere uma entrega correspondente e que mudanças de status sejam propagadas automaticamente.

## Ações Estruturais

### 1. Banco de Dados (Supabase Migration)
- Adicionar colunas de vínculo na tabela `public.entregas`:
  - `venda_id` (UUID, FK para `vendas.id`, ON DELETE CASCADE).
  - `cliente_id` (UUID, FK para `clientes.id`).
- Criar a função trigger `public.handle_sync_venda_para_entrega()`:
  - **INSERT**: Cria um registro em `entregas` para cada nova venda.
  - **UPDATE**: Sincroniza `status_entrega` da venda com o `status` da entrega.
- Criar a função trigger `public.handle_sync_entrega_para_venda()`:
  - **UPDATE**: Sincroniza o `status` da entrega de volta para o `status_entrega` da venda.
- Habilitar RLS e garantir `GRANT` para as novas operações.

### 2. Interface de Vendas
- Atualizar `src/components/vendas/formulario-venda.tsx`:
  - Incluir o campo `status_entrega` no formulário (se ainda não estiver explícito).
  - Mapear a lógica de salvamento para garantir que os dados necessários para a entrega (data prevista) sejam enviados corretamente.

### 3. Interface de Entregas
- Garantir que a listagem em `src/routes/_authenticated/entregas.tsx` reflita os dados sincronizados.

## Detalhes Técnicos
- Uso de `SECURITY DEFINER` nas funções trigger para garantir permissão de escrita entre tabelas.
- Mapeamento de Status:
  - Venda: `confirmada`, `em_producao`, `pronta`, `parcialmente_entregue`, `entregue`, `cancelada`, `reembolsada`.
  - Entrega: `pendente`, `em_rota`, `entregue`, `falhou`, `cancelada`, `reposicao`.
- A sincronização automática reduz o retrabalho manual e garante integridade dos dados para o Dashboard.
