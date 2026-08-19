import { createFileRoute } from "@tanstack/react-router";

import { ModuloRegistros } from "@/components/comum/modulo-registros";

export const Route = createFileRoute("/_authenticated/entregas")({
  head: () => ({
    meta: [
      { title: "Entregas | Gestão BMs" },
      { name: "description", content: "Programação e acompanhamento das entregas aos clientes." },
      { property: "og:title", content: "Entregas | Gestão BMs" },
      { property: "og:description", content: "Programação e acompanhamento das entregas aos clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <ModuloRegistros
      titulo="Entregas"
      descricao="Programação e acompanhamento das entregas aos clientes."
      tabela="entregas"
      chaveConsulta="entregas"
      rotuloBotao="Adicionar entrega"
      ordenarPor={{ coluna: "created_at" }}
      campos={[
        { 
          nome: "cliente_id", 
          rotulo: "Cliente", 
          tipo: "relacao", 
          subtipo: "combobox",
          relacao: { tabela: "clientes", rotulo: "nome" } 
        },
        { nome: "destinatario", rotulo: "Destinatário", tipo: "texto" },
        { nome: "endereco", rotulo: "Endereço", tipo: "texto" },
        { nome: "data_prevista", rotulo: "Data prevista", tipo: "data" },
        { nome: "data_realizada", rotulo: "Data realizada", tipo: "data" },
        { nome: "transportadora", rotulo: "Transportadora", tipo: "texto" },
        {
          nome: "status",
          rotulo: "Status",
          tipo: "selecao",
          padrao: "pendente",
          opcoes: [
            { valor: "pendente", rotulo: "Pendente" },
            { valor: "em_rota", rotulo: "Em rota" },
            { valor: "entregue", rotulo: "Entregue" },
            { valor: "falhou", rotulo: "Falhou" },
            { valor: "cancelada", rotulo: "Cancelada" },
            { valor: "reposicao", rotulo: "Reposição" },
          ],
        },
        {
          nome: "custo_reposicao",
          rotulo: "Custo da Reposição (R$)",
          tipo: "moeda",
          visivel: (v) => v['status'] === "reposicao",
        },
        { nome: "observacoes", rotulo: "Observações", tipo: "texto_longo" },
      ]}
      colunas={[
        { nome: "destinatario", rotulo: "Destinatário" },
        { nome: "endereco", rotulo: "Endereço" },
        { nome: "data_prevista", rotulo: "Prevista", formato: "data" },
        { nome: "transportadora", rotulo: "Transportadora" },
        { nome: "status", rotulo: "Status" },
        { nome: "custo_reposicao", rotulo: "Custo Repos.", formato: "moeda" },
      ]}
      vazioTitulo="Nenhuma entrega programada"
      vazioDescricao="Programe a primeira entrega para acompanhar prazos e status."
    />
  );
}
