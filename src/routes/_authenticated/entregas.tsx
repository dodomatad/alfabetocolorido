import { createFileRoute } from "@tanstack/react-router";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { ModuloPendente } from "@/components/comum/modulo-pendente";

export const Route = createFileRoute("/_authenticated/entregas")({
  head: () => ({
    meta: [
      { title: "Entregas | Gestão BMs" },
      { name: "description", content: "Programação e confirmação das entregas aos clientes." },
      { property: "og:title", content: "Entregas | Gestão BMs" },
      { property: "og:description", content: "Programação e confirmação das entregas aos clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Entregas" descricao="Programação e confirmação das entregas aos clientes."
        acoes={<BotaoAdicionar modulo="Entregas" proximaEtapa="criar as tabelas de romaneios e entregas por item de venda." />}
      />
      <ModuloPendente modulo="Entregas" proximaEtapa="criar as tabelas de entregas e itens entregues vinculadas às vendas." />
    </div>
  );
}
