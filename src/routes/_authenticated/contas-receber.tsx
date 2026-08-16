import { createFileRoute } from "@tanstack/react-router";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { ModuloPendente } from "@/components/comum/modulo-pendente";

export const Route = createFileRoute("/_authenticated/contas-receber")({
  head: () => ({
    meta: [
      { title: "Contas a receber | Gestão BMs" },
      { name: "description", content: "Títulos a receber de clientes, vencimentos e baixas." },
      { property: "og:title", content: "Contas a receber | Gestão BMs" },
      { property: "og:description", content: "Títulos a receber de clientes, vencimentos e baixas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Contas a receber" descricao="Títulos a receber de clientes, vencimentos e baixas." />
      <ModuloPendente modulo="Contas a receber" proximaEtapa="criar a tabela de títulos a receber com parcelas e baixas." />
    </div>
  );
}
