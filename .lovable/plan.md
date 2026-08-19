# Plano de Integração: Produção e Estoque

Implementar a sincronização automática entre os registros de produção e o saldo de estoque, garantindo que a produção concluída alimente o estoque em tempo real.

## Ações Estruturais

### 1. Banco de Dados (Supabase Migration)
- **Tabela de Estoque**: Criar ou garantir a existência da tabela `public.estoque` com colunas para `empresa_id`, `tipo_ativo`, `quantidade_disponivel`, etc.
- **Constraint de Unicidade**: Adicionar UNIQUE em `(empresa_id, tipo_ativo)` para permitir a operação `ON CONFLICT`.
- **Função Trigger `public.handle_sync_producao_para_estoque()`**:
  - **INSERT**: Soma a quantidade aprovada ao saldo do estoque.
  - **UPDATE**: Ajusta a diferença de saldo caso a quantidade aprovada seja editada.
- **Trigger**: Associar à tabela `public.producao_diaria`.

### 2. Interface de Estoque
- Desenvolver ou atualizar a página de Estoque em `src/routes/_authenticated/estoque.tsx` usando o componente `ModuloRegistros` para exibir o saldo atualizado.

### 3. Interface de Produção
- Garantir que o formulário de produção em `src/routes/_authenticated/producao.tsx` possua os campos `tipo_bm` ou `tipo_perfil` e `quantidade_aprovadas` para alimentar o gatilho corretamente.

## Detalhes Técnicos
- Uso de `SECURITY DEFINER` e `search_path` seguro na função trigger.
- RLS habilitado na tabela de estoque com isolamento por `empresa_id`.
- Sincronização automática via banco de dados para garantir integridade mesmo se a interface for fechada durante o processamento.
