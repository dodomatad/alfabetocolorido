import { createFileRoute } from "@tanstack/react-router";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { ModuloPendente } from "@/components/comum/modulo-pendente";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque | Gestão BMs" },
      { name: "description", content: "Controle de saldo, entradas e saídas de materiais e BMs prontas." },
      { property: "og:title", content: "Estoque | Gestão BMs" },
      { property: "og:description", content: "Controle de saldo, entradas e saídas de materiais e BMs prontas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Estoque" descricao="Controle de saldo, entradas e saídas de materiais e BMs prontas."
        acoes={<BotaoAdicionar modulo="Estoque" proximaEtapa="criar as tabelas de produtos, movimentações e saldo por depósito." />}
      />
      <ModuloPendente modulo="Estoque" proximaEtapa="criar as tabelas de produtos, movimentações e saldo por depósito." />
    </div>
  );
}
