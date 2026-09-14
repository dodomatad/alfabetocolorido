import { createFileRoute } from "@tanstack/react-router";
import { ModuloRegistros } from "@/components/comum/modulo-registros";
import { Package } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/use-sessao";
import { CartaoMetrica } from "@/components/dashboard/cartao-metrica";


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


function DashboardEstoque() {
  const { empresa } = useSessao();
  const { data: estoque } = useQuery({
    queryKey: ["estoque", empresa?.id],
    enabled: !!empresa?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque")
        .select("tipo_ativo, quantidade_disponivel");
      if (error) throw error;
      return data || [];
    }
  });

  const getQtd = (tipo: string) => {
    return estoque?.filter(e => e.tipo_ativo === tipo).reduce((acc, curr) => acc + Number(curr.quantidade_disponivel || 0), 0) || 0;
  };

  const tipos = ["BM 250", "BM 2K", "BM 10K", "BM 100K", "BM Ilimitada", "Perfil Farmado"];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {tipos.map(tipo => (
        <CartaoMetrica
          key={tipo}
          rotulo={tipo}
          valor={String(getQtd(tipo))}
          icone={Package}
          corValor="text-blue-500"
          detalhe="Em estoque"
        />
      ))}
    </div>
  );
}


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
      topComponent={<DashboardEstoque />}
    />
  );
}
