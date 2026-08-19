import { createFileRoute } from "@tanstack/react-router";
import { ModuloRegistros } from "@/components/comum/modulo-registros";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque | Gestão BMs" },
      { name: "description", content: "Controle de saldo e ativos disponíveis (BMs, Perfis e Contas)." },
      { property: "og:title", content: "Estoque | Gestão BMs" },
      { property: "og:description", content: "Controle de saldo e ativos disponíveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaEstoque,
});

function PaginaEstoque() {
  return (
    <ModuloRegistros
      titulo="Estoque"
      descricao="Controle de saldo e disponibilidade de ativos digitais."
      tabela="estoque"
      chaveConsulta="estoque"
      ordenarPor={{ coluna: "quantidade_disponivel", ascendente: false }}
      campos={[
        {
          nome: "tipo_ativo",
          rotulo: "Tipo de Ativo",
          tipo: "selecao",
          opcoes: [
            { valor: "BM 250", rotulo: "BM 250" },
            { valor: "BM 2K", rotulo: "BM 2K" },
            { valor: "BM 10K", rotulo: "BM 10K" },
            { valor: "BM 100K", rotulo: "BM 100K" },
            { valor: "BM Ilimitada", rotulo: "BM Ilimitada" },
            { valor: "Perfil Farmado", rotulo: "Perfil Farmado" },
          ],
        },
        { nome: "quantidade_disponivel", rotulo: "Qtd. Disponível", tipo: "numero" },
        { nome: "quantidade_reservada", rotulo: "Qtd. Reservada", tipo: "numero" },
        { nome: "custo_medio_unitario", rotulo: "Custo Médio Unitário (R$)", tipo: "moeda" },
        {
          nome: "status",
          rotulo: "Status",
          tipo: "selecao",
          padrao: "em_estoque",
          opcoes: [
            { valor: "em_estoque", rotulo: "Em Estoque" },
            { valor: "baixo_estoque", rotulo: "Baixo Estoque" },
            { valor: "esgotado", rotulo: "Esgotado" },
          ],
        },
      ]}
      colunas={[
        { nome: "tipo_ativo", rotulo: "Tipo de Ativo" },
        { nome: "quantidade_disponivel", rotulo: "Disponível" },
        { nome: "quantidade_reservada", rotulo: "Reservado" },
        { nome: "custo_medio_unitario", rotulo: "Custo Médio", formato: "moeda" },
        { nome: "status", rotulo: "Status" },
      ]}
      vazioTitulo="Seu estoque está vazio"
      vazioDescricao="Registre manualmente ou aguarde a sincronização automática da produção diária."
    />
  );
}
