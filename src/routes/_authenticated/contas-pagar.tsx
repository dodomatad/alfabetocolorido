import { createFileRoute } from "@tanstack/react-router";

import { ModuloRegistros } from "@/components/comum/modulo-registros";

export const Route = createFileRoute("/_authenticated/contas-pagar")({
  head: () => ({
    meta: [
      { title: "Contas a pagar | Gestão BMs" },
      { name: "description", content: "Pagamentos previstos, vencimentos e situação de cada título." },
      { property: "og:title", content: "Contas a pagar | Gestão BMs" },
      { property: "og:description", content: "Pagamentos previstos, vencimentos e situação de cada título." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <ModuloRegistros
      titulo="Contas a pagar"
      descricao="Pagamentos previstos, vencimentos e situação de cada título."
      tabela="lancamentos_financeiros"
      chaveConsulta="contas_pagar"
      rotuloBotao="Adicionar pagamento"
      ordenarPor={{ coluna: "data_vencimento" }}
      filtroFixo={{ tipo: "pagar" }}
      campos={[
        { nome: "descricao", rotulo: "Descrição", tipo: "texto", obrigatorio: true },
        { nome: "fornecedor_id", rotulo: "Fornecedor", tipo: "relacao", relacao: { tabela: "fornecedores", rotulo: "nome" } },
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
        { nome: "descricao", rotulo: "Descrição" },
        { nome: "categoria", rotulo: "Categoria" },
        { nome: "data_vencimento", rotulo: "Vencimento", formato: "data" },
        { nome: "situacao", rotulo: "Situação" },
        { nome: "valor", rotulo: "Valor", formato: "moeda", alinharDireita: true },
      ]}
      vazioTitulo="Nenhuma conta a pagar"
      vazioDescricao="Lance a primeira despesa prevista para acompanhar o caixa."
    />
  );
}
