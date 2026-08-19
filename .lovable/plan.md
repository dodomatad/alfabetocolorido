# Plano de Implementação: Taxa de Reposição no Dashboard

Implementação da métrica de "Taxa de Reposição" (Garantia) no Dashboard, incluindo atualizações no banco de dados para rastrear reposições e um novo card interativo com modal de detalhes.

## Alterações Sugeridas

### Banco de Dados (Supabase)
- **Nova Tabela `public.reposicoes`**:
  - `id` (uuid, primary key)
  - `empresa_id` (uuid, references empresas)
  - `venda_id` (uuid, references vendas, opcional)
  - `cliente_id` (uuid, references clientes)
  - `modalidade_id` (uuid, references modalidades_bm)
  - `data_reposicao` (date)
  - `motivo` (text: ex: 'Bloqueio pré-uso', 'Checkpoint', 'Queda de BM')
  - `status` (text: 'pendente', 'concluida', 'cancelada')
  - `observacoes` (text)
- **RLS e Grants**: Configurar isolamento por `empresa_id` e permissões para `authenticated` e `service_role`.
- **Trigger `updated_at`**: Adicionar para auditoria.

### Frontend

#### 1. Dashboard (`src/routes/_authenticated/index.tsx`)
- **Cálculo da Métrica**:
  - `Total Entregue`: Soma de `quantidade` em `venda_itens` de vendas confirmadas/entregues.
  - `Total Reposto`: Contagem de registros na nova tabela `reposicoes`.
  - `Taxa`: `(Total Reposto / Total Entregue) * 100`.
- **Novo Card de Métrica**:
  - Título: "Taxa de Reposição".
  - Valor: Porcentagem com cores dinâmicas (Azul < 10%, Laranja 10-20%, Vermelho > 20%).
  - Subtexto: "X de Y perfis entregues".
  - Ação: Clique abre o modal de histórico.
- **Modal de Detalhamento**: Tabela com histórico de reposições filtrado pelo período selecionado.

#### 2. Novos Módulos / UI
- **Formulário de Reposição**: Criar modal para registrar novas reposições (pode ser acessado via aba "Vendas" ou "Clientes").
- **Integração nas Entregas**: Adicionar opção de marcar uma entrega como "Reposição de Garantia".

## Detalhes Técnicos
- **Fórmula**: `Taxa = (Qtd Reposições / Qtd Contas Vendidas) * 100`.
- **Estilo**: Manter o padrão Dark Mode do projeto (fundo `#141417`, bordas `#27272A/50`).
- **Segurança**: RLS garantindo que usuários vejam apenas dados de sua empresa.

## Considerações
- Se uma venda for "Reposição" integral, ela deve impactar a taxa ou ser contada apenas como item? A abordagem de tabela separada `reposicoes` é mais limpa para rastrear garantias sem inflar o faturamento.
