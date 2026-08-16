import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, ShoppingCart, Users, Wallet } from "lucide-react";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CartaoIndicador } from "@/components/comum/cartao-indicador";
import { CarregandoCartoes, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { SeloStatusVenda } from "@/components/comum/selo-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarMoeda } from "@/lib/formatadores";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Visão geral | Gestão BMs" },
      {
        name: "description",
        content:
          "Painel com indicadores de vendas, cadastros e faturamento do período no Gestão BMs.",
      },
      { property: "og:title", content: "Visão geral | Gestão BMs" },
      {
        property: "og:description",
        content: "Indicadores de vendas, cadastros e faturamento do período.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisaoGeral,
});

type VendaRecente = {
  id: string;
  numero: number;
  status: string;
  valor_total: number | string;
  data_venda: string;
  clientes: { nome: string } | null;
};

function VisaoGeral() {
  const { empresa, perfil, fuso } = useSessao();

  const consulta = useQuery({
    queryKey: ["visao-geral", empresa?.id],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const inicioIso = inicioMes.toISOString().slice(0, 10);

      const [clientes, fornecedores, vendasMes, recentes] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("fornecedores").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase
          .from("vendas")
          .select("valor_total, status")
          .gte("data_venda", inicioIso)
          .neq("status", "cancelada"),
        supabase
          .from("vendas")
          .select("id, numero, status, valor_total, data_venda, clientes(nome)")
          .order("data_venda", { ascending: false })
          .limit(6),
      ]);

      const primeiroErro =
        clientes.error ?? fornecedores.error ?? vendasMes.error ?? recentes.error;
      if (primeiroErro) throw primeiroErro;

      const linhas = vendasMes.data ?? [];
      const faturamento = linhas.reduce((soma, v) => soma + Number(v.valor_total ?? 0), 0);

      return {
        clientes: clientes.count ?? 0,
        fornecedores: fornecedores.count ?? 0,
        vendasMes: linhas.length,
        faturamento,
        recentes: (recentes.data ?? []) as unknown as VendaRecente[],
      };
    },
  });

  const primeiroNome = (perfil?.nome ?? "").split(" ")[0];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo={primeiroNome ? `Olá, ${primeiroNome}` : "Visão geral"}
        descricao="Resumo da operação da empresa no mês corrente."
      />

      {consulta.isLoading ? (
        <CarregandoCartoes />
      ) : consulta.isError ? (
        <EstadoErro
          descricao={(consulta.error as Error).message}
          aoTentarNovamente={() => void consulta.refetch()}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CartaoIndicador
              rotulo="Faturamento no mês"
              valor={formatarMoeda(consulta.data?.faturamento ?? 0)}
              detalhe="Vendas não canceladas do mês corrente"
              tom={(consulta.data?.faturamento ?? 0) > 0 ? "positivo" : "neutro"}
              icone={Wallet}
            />
            <CartaoIndicador
              rotulo="Vendas no mês"
              valor={String(consulta.data?.vendasMes ?? 0)}
              detalhe="Pedidos registrados desde o dia 1º"
              icone={ShoppingCart}
            />
            <CartaoIndicador
              rotulo="Clientes ativos"
              valor={String(consulta.data?.clientes ?? 0)}
              detalhe="Cadastros disponíveis para venda"
              icone={Users}
            />
            <CartaoIndicador
              rotulo="Fornecedores ativos"
              valor={String(consulta.data?.fornecedores ?? 0)}
              detalhe="Parceiros habilitados para compras"
              icone={Building2}
            />
          </div>

          <section className="rounded-lg border bg-card">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Vendas recentes</h2>
              <p className="text-xs text-muted-foreground">Últimos pedidos registrados na empresa.</p>
            </div>
            {(consulta.data?.recentes.length ?? 0) === 0 ? (
              <div className="p-4">
                <EstadoVazio
                  icone={<ShoppingCart className="size-5" aria-hidden="true" />}
                  titulo="Nenhuma venda registrada"
                  descricao="Assim que a primeira venda for lançada, ela aparecerá aqui com status e valor."
                  className="border-0"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consulta.data?.recentes.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell className="num font-medium">{venda.numero}</TableCell>
                        <TableCell>{venda.clientes?.nome ?? "—"}</TableCell>
                        <TableCell className="num">{formatarData(venda.data_venda, fuso)}</TableCell>
                        <TableCell>
                          <SeloStatusVenda status={venda.status} />
                        </TableCell>
                        <TableCell className="num text-right font-medium">
                          {formatarMoeda(venda.valor_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
