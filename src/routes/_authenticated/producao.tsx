import { createFileRoute } from "@tanstack/react-router";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { ModuloPendente } from "@/components/comum/modulo-pendente";

export const Route = createFileRoute("/_authenticated/producao")({
  head: () => ({
    meta: [
      { title: "Produção | Gestão BMs" },
      { name: "description", content: "Acompanhe as ordens de produção das BMs, etapas e responsáveis." },
      { property: "og:title", content: "Produção | Gestão BMs" },
      { property: "og:description", content: "Acompanhe as ordens de produção das BMs, etapas e responsáveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Produção" descricao="Acompanhe as ordens de produção das BMs, etapas e responsáveis." />
      <ModuloPendente modulo="Ordens de produção" proximaEtapa="criar as tabelas de ordens de produção e apontamentos ligadas aos itens de venda." />
    </div>
  );
}
