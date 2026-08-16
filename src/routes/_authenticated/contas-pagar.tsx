import { createFileRoute } from "@tanstack/react-router";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { ModuloPendente } from "@/components/comum/modulo-pendente";

export const Route = createFileRoute("/_authenticated/contas-pagar")({
  head: () => ({
    meta: [
      { title: "Contas a pagar | Gestão BMs" },
      { name: "description", content: "Títulos a pagar a fornecedores, vencimentos e baixas." },
      { property: "og:title", content: "Contas a pagar | Gestão BMs" },
      { property: "og:description", content: "Títulos a pagar a fornecedores, vencimentos e baixas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Contas a pagar" descricao="Títulos a pagar a fornecedores, vencimentos e baixas." />
      <ModuloPendente modulo="Contas a pagar" proximaEtapa="criar a tabela de títulos a pagar com parcelas e baixas." />
    </div>
  );
}
