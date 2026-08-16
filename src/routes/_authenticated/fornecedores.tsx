import { createFileRoute } from "@tanstack/react-router";

import { CadastroPessoas } from "@/components/cadastros/cadastro-pessoas";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores | Gestão BMs" },
      {
        name: "description",
        content: "Cadastro de fornecedores com documento, contato e situação para compras e pagamentos.",
      },
      { property: "og:title", content: "Fornecedores | Gestão BMs" },
      {
        property: "og:description",
        content: "Cadastro de fornecedores com documento, contato e situação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <CadastroPessoas
      tabela="fornecedores"
      titulo="Fornecedores"
      singular="Fornecedor"
      descricao="Parceiros de compra utilizados em estoque e contas a pagar."
    />
  ),
});
