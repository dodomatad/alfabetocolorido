import { createFileRoute } from "@tanstack/react-router";

import { ModuloRegistros } from "@/components/comum/modulo-registros";

export const Route = createFileRoute("/_authenticated/contas-receber")({
  head: () => ({
    meta: [
      { title: "Contas a receber | Gestão BMs" },
      { name: "description", content: "Recebimentos previstos, vencimentos e situação de cada título." },
      { property: "og:title", content: "Contas a receber | Gestão BMs" },
      { property: "og:description", content: "Recebimentos previstos, vencimentos e situação de cada título." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <ModuloRegistros
      titulo="Contas a receber"
      descricao="Recebimentos previstos, vencimentos e situação de cada título."
      tabela="lancamentos_financeiros"
      chaveConsulta="contas_receber"
      rotuloBotao="Adicionar recebimento"
      ordenarPor={{ coluna: "data_vencimento" }}
      filtroFixo={{ tipo: "receber" }}
      campos={[
        { nome: "descricao", rotulo: "Descrição", tipo: "texto", obrigatorio: true },
        { nome: "cliente_id", rotulo: "Cliente", tipo: "relacao", relacao: { tabela: "clientes", rotulo: "nome" } },
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
      vazioTitulo="Nenhuma conta a receber"
      vazioDescricao="Lance o primeiro recebimento previsto para acompanhar o caixa."
    />
  );
}
