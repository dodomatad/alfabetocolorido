# Plano de Implementação: Reposições em Entregas

Implementar a opção de "Reposição" no módulo de entregas, integrando o custo operacional diretamente ao lucro líquido e às métricas do dashboard.

## Alterações Tecnicas

### 1. Banco de Dados (Supabase)
- Adicionar a coluna `custo_reposicao` (numeric 10,2) à tabela `public.entregas`.
- A coluna `status` da tabela `public.entregas` já é baseada em um enum ou texto. Garantir que aceite o valor `reposicao`.

### 2. Interface do Usuário (Frontend)
- **Componente ModuloRegistros**:
  - Adicionar suporte a campos condicionais baseados em valores de outros campos (especificamente para exibir "Custo da Reposição" apenas quando o status for "reposicao").
- **Página de Entregas**:
  - Atualizar a configuração do `ModuloRegistros` para incluir a nova opção de status e o campo de custo.
  - Adicionar badge visual para o status "Reposição".

### 3. Dashboard
- Atualizar a query do dashboard para incluir os dados da tabela `entregas`.
- Integrar o custo de reposição das entregas no cálculo de `lucro` e `custosTotais`.
- Atualizar a métrica de `taxaReposicao` para somar as reposições registradas via entregas.

## Etapas

1. **Migração**: Criar a coluna `custo_reposicao` na tabela `entregas`.
2. **Refatoração do Componente Genérico**: Ajustar o `ModuloRegistros.tsx` para permitir visibilidade condicional de campos.
3. **Página de Entregas**: Configurar o novo status e campo no formulário e na listagem.
4. **Dashboard**: Unificar a lógica de custos e taxas entre as duas tabelas (`reposicoes_perfis` e `entregas`).
