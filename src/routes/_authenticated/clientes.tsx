import { createFileRoute } from "@tanstack/react-router";

import { CadastroPessoas } from "@/components/cadastros/cadastro-pessoas";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | Gestão BMs" },
      {
        name: "description",
        content: "Cadastro de clientes com documento, contato e situação para vendas e cobranças.",
      },
      { property: "og:title", content: "Clientes | Gestão BMs" },
      {
        property: "og:description",
        content: "Cadastro de clientes com documento, contato e situação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <CadastroPessoas
      tabela="clientes"
      titulo="Clientes"
      singular="Cliente"
      descricao="Base de clientes usada em vendas, entregas e contas a receber."
    />
  ),
});
