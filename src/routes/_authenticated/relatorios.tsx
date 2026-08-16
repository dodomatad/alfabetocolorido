import { createFileRoute } from "@tanstack/react-router";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { ModuloPendente } from "@/components/comum/modulo-pendente";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | Gestão BMs" },
      { name: "description", content: "Resultados por período, cliente, modalidade e responsável." },
      { property: "og:title", content: "Relatórios | Gestão BMs" },
      { property: "og:description", content: "Resultados por período, cliente, modalidade e responsável." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Relatórios" descricao="Resultados por período, cliente, modalidade e responsável."
        acoes={<BotaoAdicionar modulo="Relatórios" proximaEtapa="consolidar vendas, produção e financeiro em relatórios." />}
      />
      <ModuloPendente modulo="Relatórios" proximaEtapa="consolidar os dados de vendas, produção e financeiro em relatórios." />
    </div>
  );
}
