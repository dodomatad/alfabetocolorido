import { createFileRoute } from "@tanstack/react-router";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { ModuloPendente } from "@/components/comum/modulo-pendente";

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
    <div className="space-y-6">
      <CabecalhoPagina titulo="Financeiro" descricao="Visão consolidada de caixa, recebimentos e pagamentos."
        acoes={<BotaoAdicionar modulo="Financeiro" proximaEtapa="criar as tabelas de lançamentos financeiros e caixa." />}
      />
      <ModuloPendente modulo="Financeiro" proximaEtapa="criar as tabelas de contas financeiras e lançamentos de caixa." />
    </div>
  );
}
