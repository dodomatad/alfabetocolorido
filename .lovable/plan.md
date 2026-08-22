# Implementação de Comissão de Funcionário em Vendas

Este plano detalha a adição de campos para vincular uma funcionária responsável e seu respectivo percentual de comissão no formulário de vendas, além da geração automática de lançamentos financeiros de repasse.

## Alterações

### Banco de Dados (Supabase)
- Adicionar colunas `responsavel_producao_id` (UUID, FK para `perfis`) e `comissao_percentual` (`numeric(5,2)`) na tabela `vendas`.
- Garantir que a tabela `lancamentos_financeiros` suporte a categoria de "Comissão/Repasse".

### Frontend
- **Formulário de Venda (`src/components/vendas/formulario-venda.tsx`):**
    - Adicionar seção "Responsável & Comissão" abaixo dos itens do pedido.
    - Implementar Select para escolher a funcionária (filtrando membros da equipe).
    - Adicionar campo numérico para o percentual de comissão.
    - Exibir cálculo em tempo real: `(Subtotal * %) / 100`.
- **Lógica de Salvamento:**
    - Atualizar a mutation `salvar` para incluir os novos campos na inserção da venda.
    - Criar automaticamente um lançamento de saída (`financeiro_tipo = 'pagar'`) na tabela `lancamentos_financeiros` se houver comissão definida, vinculado à funcionária.

## Detalhes Técnicos
- Utilizar `useQuery` para carregar a lista de funcionárias da tabela `perfis` filtrando pela empresa atual.
- O lançamento financeiro será gerado com `descricao` contendo o número da venda e status `aberto`.
- Formatação de valores monetários seguindo o padrão `formatarMoeda`.

## Verificação
- Abrir o modal de "Adicionar Venda".
- Selecionar uma funcionária e definir 10% de comissão.
- Validar se o cálculo exibido está correto.
- Salvar a venda e verificar se o registro no banco contém os IDs e valores esperados.
- Conferir se um novo lançamento apareceu no módulo Financeiro.
