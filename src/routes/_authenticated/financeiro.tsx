import { createFileRoute } from "@tanstack/react-router";

import { ModuloRegistros } from "@/components/comum/modulo-registros";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro | Gestão BMs" },
      { name: "description", content: "Visão consolidada de caixa, recebimentos e pagamentos." },
      { property: "og:title", content: "Financeiro | Gestão BMs" },
      { property: "og:description", content: "Visão consolidada de caixa, recebimentos e pagamentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <ModuloRegistros
      titulo="Financeiro"
      descricao="Visão consolidada de caixa, recebimentos e pagamentos."
      tabela="lancamentos_financeiros"
      chaveConsulta="financeiro"
      rotuloBotao="Adicionar lançamento"
      ordenarPor={{ coluna: "data_vencimento" }}
      campos={[
        {
          nome: "tipo",
          rotulo: "Tipo",
          tipo: "selecao",
          obrigatorio: true,
          padrao: "receber",
          opcoes: [
            { valor: "receber", rotulo: "A receber" },
            { valor: "pagar", rotulo: "A pagar" },
          ],
        },
        { nome: "descricao", rotulo: "Descrição", tipo: "texto", obrigatorio: true },
        { nome: "categoria", rotulo: "Categoria", tipo: "texto" },
        { nome: "valor", rotulo: "Valor (R$)", tipo: "moeda", padrao: "0" },
        { nome: "data_vencimento", rotulo: "Vencimento", tipo: "data" },
        { nome: "data_pagamento", rotulo: "Pagamento", tipo: "data" },
        { nome: "forma_pagamento", rotulo: "Forma de pagamento", tipo: "texto" },
        {
          nome: "situacao",
          rotulo: "Situação",
          tipo: "selecao",
          padrao: "aberto",
          opcoes: [
            { valor: "aberto", rotulo: "Em aberto" },
            { valor: "parcial", rotulo: "Parcial" },
            { valor: "pago", rotulo: "Pago" },
            { valor: "atrasado", rotulo: "Atrasado" },
            { valor: "cancelado", rotulo: "Cancelado" },
          ],
        },
        { nome: "observacoes", rotulo: "Observações", tipo: "texto_longo" },
      ]}
      colunas={[
        { nome: "tipo", rotulo: "Tipo" },
        { nome: "descricao", rotulo: "Descrição" },
        { nome: "data_vencimento", rotulo: "Vencimento", formato: "data" },
        { nome: "situacao", rotulo: "Situação" },
        { nome: "valor", rotulo: "Valor", formato: "moeda", alinharDireita: true },
      ]}
      vazioTitulo="Nenhum lançamento financeiro"
      vazioDescricao="Registre recebimentos e pagamentos para acompanhar o caixa da empresa."
    />
  );
}
