import { createFileRoute } from "@tanstack/react-router";

import { ModuloRegistros } from "@/components/comum/modulo-registros";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque | Gestão BMs" },
      { name: "description", content: "Controle de itens, quantidades mínimas e custo unitário do estoque." },
      { property: "og:title", content: "Estoque | Gestão BMs" },
      { property: "og:description", content: "Controle de itens, quantidades mínimas e custo unitário do estoque." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <ModuloRegistros
      titulo="Estoque"
      descricao="Itens em estoque, quantidades, mínimos e custo unitário."
      tabela="itens_estoque"
      chaveConsulta="itens_estoque"
      rotuloBotao="Adicionar item"
      ordenarPor={{ coluna: "created_at" }}
      campos={[
        { nome: "nome", rotulo: "Item", tipo: "texto", obrigatorio: true },
        { nome: "codigo", rotulo: "Código", tipo: "texto" },
        { nome: "unidade", rotulo: "Unidade", tipo: "texto", padrao: "un" },
        { nome: "quantidade_atual", rotulo: "Quantidade atual", tipo: "numero", padrao: "0" },
        { nome: "quantidade_minima", rotulo: "Quantidade mínima", tipo: "numero", padrao: "0" },
        { nome: "custo_unitario", rotulo: "Custo unitário (R$)", tipo: "moeda", padrao: "0" },
        { nome: "localizacao", rotulo: "Localização", tipo: "texto" },
        { nome: "observacoes", rotulo: "Observações", tipo: "texto_longo" },
      ]}
      colunas={[
        { nome: "nome", rotulo: "Item" },
        { nome: "unidade", rotulo: "Un." },
        { nome: "quantidade_atual", rotulo: "Atual", alinharDireita: true },
        { nome: "quantidade_minima", rotulo: "Mínimo", alinharDireita: true },
        { nome: "custo_unitario", rotulo: "Custo", formato: "moeda", alinharDireita: true },
      ]}
      vazioTitulo="Nenhum item em estoque"
      vazioDescricao="Cadastre os insumos e produtos que precisam de controle de quantidade."
    />
  );
}
