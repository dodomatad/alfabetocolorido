import { createFileRoute } from "@tanstack/react-router";

import { ModuloRegistros } from "@/components/comum/modulo-registros";

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
    <ModuloRegistros
      titulo="Produção"
      descricao="Ordens de produção das BMs, com quantidade, responsável e prazo."
      tabela="ordens_producao"
      chaveConsulta="ordens_producao"
      rotuloBotao="Adicionar ordem"
      ordenarPor={{ coluna: "created_at" }}
      campos={[
        { nome: "descricao", rotulo: "Descrição", tipo: "texto", obrigatorio: true },
        { nome: "quantidade", rotulo: "Quantidade", tipo: "numero", padrao: "1" },
        { nome: "responsavel", rotulo: "Responsável", tipo: "texto" },
        { nome: "data_inicio", rotulo: "Início", tipo: "data" },
        { nome: "data_prazo", rotulo: "Prazo", tipo: "data" },
        {
          nome: "status",
          rotulo: "Status",
          tipo: "selecao",
          padrao: "planejada",
          opcoes: [
            { valor: "planejada", rotulo: "Planejada" },
            { valor: "em_producao", rotulo: "Em produção" },
            { valor: "pausada", rotulo: "Pausada" },
            { valor: "concluida", rotulo: "Concluída" },
            { valor: "cancelada", rotulo: "Cancelada" },
          ],
        },
        { nome: "observacoes", rotulo: "Observações", tipo: "texto_longo" },
      ]}
      colunas={[
        { nome: "descricao", rotulo: "Descrição" },
        { nome: "quantidade", rotulo: "Qtd.", alinharDireita: true },
        { nome: "responsavel", rotulo: "Responsável" },
        { nome: "data_prazo", rotulo: "Prazo", formato: "data" },
        { nome: "status", rotulo: "Status" },
      ]}
      vazioTitulo="Nenhuma ordem de produção"
      vazioDescricao="Cadastre a primeira ordem para acompanhar a produção das BMs."
    />
  );
}
