---
name: Ajuste do Modal de Reposição
description: Melhora a seleção de vendas no modal de reposição, incluindo o nome do cliente e preenchimento automático.
type: feature
---

# Plano de Ajuste do Modal de Reposição

Ajustar o modal de "Nova Reposição" para facilitar a identificação das vendas e automatizar o preenchimento do nome do cliente.

## Alterações Técnicas

### 1. Busca de Dados (Dashboard)
- Atualizar a query de busca de vendas recentes em `src/routes/_authenticated/index.tsx` para incluir explicitamente o campo `cliente` e `numero_venda`.

### 2. Interface do Modal
- **Mapeamento de Opções**: Alterar o `<SelectItem>` em `src/components/dashboard/modal-adicionar-reposicao.tsx` para exibir o nome do cliente antes do número da venda: `{venda.cliente ? \`${venda.cliente} — \` : ''}Venda #{venda.numero_venda || venda.id.slice(0, 8)} ({new Date(venda.created_at).toLocaleDateString('pt-BR')})`.
- **Preenchimento Automático**: Atualizar a função `handleVendaChange` para que, ao selecionar uma venda, o estado `cliente_nome` seja preenchido com o valor de `venda.cliente` (ou o nome do cliente formatado).

## Passos de Verificação
- Abrir o dashboard.
- Clicar em "Nova Reposição".
- Verificar se a lista de vendas exibe o nome do cliente.
- Selecionar uma venda e confirmar se o campo "Nome do Cliente / Identificação" é preenchido automaticamente.
