# Plano de Unificação Financeira

Unificar as abas de "Contas a Pagar" e "Contas a Receber" em uma aba centralizada de "Financeiro" (Gestão Financeira & Lançamentos) com dashboard consolidado e tabela unificada.

## Etapas

### 1. Atualização do Menu e Rotas
- Modificar `src/components/layout/menu-navegacao.ts` para remover "Contas a receber" e "Contas a pagar".
- Manter apenas "Financeiro" no grupo Financeiro.

### 2. Implementação da Nova Tela Financeira
- Refatorar `src/routes/_authenticated/financeiro.tsx`.
- Adicionar indicadores (Cards): Total a Receber, Total a Pagar, Saldo Previsto, Contas em Atraso.
- Implementar filtros: Tipo (Todos, Entradas, Saídas), Período e Status.
- Criar a Tabela Unificada com diferenciação visual (setas verde/vermelha, valores +/-).
- Atualizar o formulário para ser dinâmico (toggle entre Receita e Despesa).

### 3. Ajustes de Banco de Dados e Segurança
- Garantir que a tabela `lancamentos_financeiros` suporte a unificação (já existente, mas verificar RLS).

### 4. Limpeza
- Remover arquivos de rotas obsoletos: `src/routes/_authenticated/contas-pagar.tsx` e `src/routes/_authenticated/contas-receber.tsx`.

## Detalhes Técnicos
- **Cards:** Usar `CartaoMetrica` ou componente similar com as cores solicitadas (#10B981, #EF4444, #3B82F6).
- **Tabela:** Adicionar coluna de ícone de tendência e aplicar classes de cores baseadas no tipo de lançamento.
- **Modal:** Usar Tabs do Shadcn para alternar entre "Receita" e "Despesa" no formulário de criação.
