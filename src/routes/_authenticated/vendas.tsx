import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { SeloStatusVenda } from "@/components/comum/selo-status";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas | Gestão BMs" },
      {
        name: "description",
        content: "Acompanhe os pedidos de venda por status, cliente, data e valor total em reais.",
      },
      { property: "og:title", content: "Vendas | Gestão BMs" },
      {
        property: "og:description",
        content: "Pedidos de venda por status, cliente, data e valor total.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaVendas,
});

type Venda = {
  id: string;
  numero: number;
  status: string;
  valor_total: number | string;
  data_venda: string;
  data_entrega_prevista: string | null;
  clientes: { nome: string } | null;
};

const STATUS = [
  "rascunho",
  "confirmada",
  "em_producao",
  "pronta",
  "parcialmente_entregue",
  "entregue",
  "cancelada",
] as const;

function PaginaVendas() {
  const { empresa, fuso } = useSessao();
  const [status, setStatus] = useState<string>("todos");

  const consulta = useQuery({
    queryKey: ["vendas", empresa?.id, status],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      let q = supabase
        .from("vendas")
        .select("id, numero, status, valor_total, data_venda, data_entrega_prevista, clientes(nome)")
        .order("numero", { ascending: false })
        .limit(50);
      if (status !== "todos") q = q.eq("status", status as (typeof STATUS)[number]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Venda[];
    },
  });

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Vendas"
        descricao="Pedidos registrados na empresa, do rascunho até a entrega."
      />

      <div className="flex justify-end">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {consulta.isLoading ? (
          <div className="p-4">
            <CarregandoTabela colunas={5} />
          </div>
        ) : consulta.isError ? (
          <div className="p-4">
            <EstadoErro
              descricao={(consulta.error as Error).message}
              aoTentarNovamente={() => void consulta.refetch()}
            />
          </div>
        ) : (consulta.data?.length ?? 0) === 0 ? (
          <div className="p-4">
            <EstadoVazio
              icone={<ShoppingCart className="size-5" aria-hidden="true" />}
              titulo="Nenhuma venda encontrada"
              descricao="O lançamento de pedidos com itens e modalidades será liberado na próxima etapa do projeto. A estrutura de dados já está pronta."
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
                  <TableHead className="hidden md:table-cell">Previsão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell className="num font-medium">{venda.numero}</TableCell>
                    <TableCell>{venda.clientes?.nome ?? "—"}</TableCell>
                    <TableCell className="num">{formatarData(venda.data_venda, fuso)}</TableCell>
                    <TableCell className="hidden md:table-cell num text-muted-foreground">
                      {formatarData(venda.data_entrega_prevista, fuso)}
                    </TableCell>
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
      </div>
    </div>
  );
}
