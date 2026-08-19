import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { SeloStatusVenda } from "@/components/comum/selo-status";
import { FormularioVenda } from "@/components/vendas/formulario-venda";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  "em_andamento",
  "efetuada",
  "falta_pagamento",
  "confirmada",
  "em_producao",
  "pronta",
  "parcialmente_entregue",
  "entregue",
  "cancelada",
  "reembolsada",
] as const;

function PaginaVendas() {
  const { empresa, fuso, temPermissao } = useSessao();
  const [status, setStatus] = useState<string>("todos");
  const [formulario, setFormulario] = useState(false);
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: ["vendas", empresa?.id, status],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      let q = supabase
        .from("vendas")
        .select("id, numero, status, status_entrega, valor_total, data_venda, data_entrega_prevista, clientes(nome)")
        .order("numero", { ascending: false })
        .limit(50);
      if (status !== "todos") q = q.eq("status", status as (typeof STATUS)[number]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Venda[];
    },
  });

  const excluirVenda = useMutation({
    mutationFn: async (vendaId: string) => {
      // 1. Exclui os itens vinculados à venda (garantindo limpeza)
      await supabase.from("venda_itens").delete().eq("venda_id", vendaId);

      // 2. Exclui a venda principal
      const { error } = await supabase.from("vendas").delete().eq("id", vendaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Venda excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir venda:", error);
      toast.error("Não foi possível excluir a venda.");
    },
  });

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Vendas"
        acoes={<BotaoAdicionar modulo="Vendas" rotulo="Adicionar venda" aoClicar={() => setFormulario(true)} />}
      />

      <FormularioVenda aberto={formulario} aoFechar={() => setFormulario(false)} />

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
              descricao="Use o botão Adicionar venda para registrar o primeiro pedido com itens e modalidades."
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
                  <TableHead>Status Venda</TableHead>
                  <TableHead>Status Entrega</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
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
                    <TableCell>
                      <SeloStatusVenda status={(venda as any).status_entrega || "pendente"} />
                    </TableCell>
                    <TableCell className="num text-right font-medium">
                      {formatarMoeda(venda.valor_total)}
                    </TableCell>
                    <TableCell className="text-center">
                      {temPermissao("vendas", "excluir") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:bg-red-950/30 hover:text-red-400 transition-colors"
                              aria-label={`Excluir venda nº ${venda.numero}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Venda Nº {venda.numero}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o registro permanentemente e atualizará os totais de faturamento e lucro do Dashboard.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => excluirVenda.mutate(venda.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Confirmar Exclusão
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
