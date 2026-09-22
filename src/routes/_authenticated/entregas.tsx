import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  MessageSquare,
  Pencil,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarData, formatarMoeda } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/entregas")({
  head: () => ({
    meta: [
      { title: "Entregas | Gestão BMs" },
      { name: "description", content: "Programação e acompanhamento das entregas aos clientes." },
      { property: "og:title", content: "Entregas | Gestão BMs" },
      { property: "og:description", content: "Programação e acompanhamento das entregas aos clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaEntregas,
});

type Entrega = {
  id: string;
  empresa_id: string;
  venda_id: string | null;
  cliente_id: string | null;
  destinatario: string | null;
  data_prevista: string | null;
  data_realizada: string | null;
  status: string;
  custo_reposicao: number | null;
  observacoes: string | null;
  created_at: string;
  clientes?: { nome: string } | null;
  vendas?: {
    id: string;
    numero: number;
    cliente: string | null;
    cliente_id: string | null;
    clientes?: { nome: string } | null;
  } | null;
};

const STATUS_OPCOES = [
  { valor: "pendente", rotulo: "Pendente" },
  { valor: "em_rota", rotulo: "Em rota" },
  { valor: "entregue", rotulo: "Entregue" },
  { valor: "falhou", rotulo: "Falhou" },
  { valor: "cancelada", rotulo: "Cancelada" },
  { valor: "reposicao", rotulo: "Reposição" },
] as const;

function SeloStatusEntrega({ status }: { status: string }) {
  switch (status) {
    case "entregue":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
          <Check className="size-3 stroke-[2.5]" />
          Entregue
        </span>
      );
    case "em_rota":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950/60 text-sky-400 border border-sky-800/50">
          <Truck className="size-3" />
          Em rota
        </span>
      );
    case "reposicao":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-400 border border-purple-800/50">
          <Clock className="size-3" />
          Reposição
        </span>
      );
    case "cancelada":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/50">
          Cancelada
        </span>
      );
    case "falhou":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/50">
          Falhou
        </span>
      );
    case "pendente":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/50">
          <Clock className="size-3" />
          Pendente
        </span>
      );
  }
}

function BotaoObservacaoRapida({
  entregaId,
  observacaoAtual,
  onSalvar,
}: {
  entregaId: string;
  observacaoAtual: string | null;
  onSalvar: (id: string, obs: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState(observacaoAtual || "");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTexto(observacaoAtual || "");
  }, [observacaoAtual]);

  const handleSalvar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSalvando(true);
    try {
      await onSalvar(entregaId, texto);
      setAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  const temObs = Boolean(observacaoAtual?.trim());

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-8 transition-colors",
            temObs
              ? "text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
              : "text-muted-foreground/60 hover:text-white hover:bg-white/10"
          )}
          onClick={(e) => e.stopPropagation()}
          title={temObs ? `Ver/Editar Observação: ${observacaoAtual}` : "Adicionar Observação"}
          aria-label="Observações da entrega"
        >
          {temObs ? <FileText className="size-4" /> : <MessageSquare className="size-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3 bg-[#18181b] border-zinc-700 text-zinc-100 shadow-xl"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-3.5 text-blue-400" />
              Notas da Entrega
            </span>
          </div>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex: Entregar no período da manhã / Deixar na portaria..."
            className="text-xs min-h-[80px] bg-zinc-900 border-zinc-700 placeholder:text-zinc-500"
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
              onClick={(e) => {
                e.stopPropagation();
                setAberto(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium"
              disabled={salvando}
              onClick={handleSalvar}
            >
              {salvando ? "Salvando..." : "Salvar Nota"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PaginaEntregas() {
  const { empresa, fuso, session, temPermissao } = useSessao();
  const queryClient = useQueryClient();
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  // Estados do Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [entregaEditando, setEntregaEditando] = useState<Entrega | null>(null);

  const [formVendaId, setFormVendaId] = useState("");
  const [formClienteId, setFormClienteId] = useState("");
  const [formDestinatario, setFormDestinatario] = useState("");
  const [formDataPrevista, setFormDataPrevista] = useState("");
  const [formDataRealizada, setFormDataRealizada] = useState("");
  const [formStatus, setFormStatus] = useState("pendente");
  const [formCustoReposicao, setFormCustoReposicao] = useState("0");
  const [formObservacoes, setFormObservacoes] = useState("");

  const consulta = useQuery({
    queryKey: ["entregas", empresa?.id, statusFiltro],
    enabled: Boolean(empresa?.id),
    staleTime: 1000 * 60,
    queryFn: async () => {
      let q = supabase
        .from("entregas")
        .select("*, clientes(nome), vendas(id, numero, cliente, cliente_id, clientes(nome))")
        .order("created_at", { ascending: false });

      if (statusFiltro !== "todos") {
        q = q.eq("status", statusFiltro);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Entrega[];
    },
  });

  const vendasQuery = useQuery({
    queryKey: ["vendas-selecao-entregas", empresa?.id],
    enabled: Boolean(empresa?.id) && modalAberto,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("id, numero, cliente, cliente_id, data_entrega_prevista, clientes(nome)")
        .order("numero", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const clientesQuery = useQuery({
    queryKey: ["clientes-selecao-entregas", empresa?.id],
    enabled: Boolean(empresa?.id) && modalAberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const alternarStatus = useMutation({
    mutationFn: async ({ id, statusAtual }: { id: string; statusAtual: string }) => {
      const novoStatus = statusAtual === "entregue" ? "pendente" : "entregue";
      const dataRealizada = novoStatus === "entregue" ? new Date().toISOString().slice(0, 10) : null;

      const { error } = await supabase
        .from("entregas")
        .update({
          status: novoStatus,
          data_realizada: dataRealizada,
          atualizado_por: session?.user.id ?? null,
        } as any)
        .eq("id", id);
      if (error) throw error;
      return novoStatus;
    },
    onSuccess: (novoStatus) => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(
        novoStatus === "entregue"
          ? "Entrega marcada como Concluída!"
          : "Status alterado para Pendente."
      );
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar status: ${err.message}`),
  });

  const marcarEntregue = useMutation({
    mutationFn: async (id: string) => {
      const hoje = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("entregas")
        .update({
          status: "entregue",
          data_realizada: hoje,
          atualizado_por: session?.user.id ?? null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Entrega confirmada com sucesso (OK)!");
    },
    onError: (err: Error) => toast.error(`Erro ao confirmar entrega: ${err.message}`),
  });

  const salvarNota = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes: string }) => {
      const { error } = await supabase
        .from("entregas")
        .update({
          observacoes: observacoes.trim() || null,
          atualizado_por: session?.user.id ?? null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast.success("Observação atualizada com sucesso!");
    },
    onError: (err: Error) => toast.error(`Erro ao salvar observação: ${err.message}`),
  });

  const salvarEntregaCompleta = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");

      let destinatarioFinal = formDestinatario.trim() || null;
      let clienteIdFinal = formClienteId || null;

      // Se selecionou uma venda e não tem cliente/destinatário, sincroniza com a venda
      if (formVendaId) {
        const v = vendasQuery.data?.find((venda) => venda.id === formVendaId);
        if (v) {
          if (!clienteIdFinal && v.cliente_id) clienteIdFinal = v.cliente_id;
          if (!destinatarioFinal) destinatarioFinal = v.cliente || (v.clientes as any)?.nome || null;
        }
      }

      // Se tem clienteId mas não tem destinatário, preenche com nome do cliente
      if (clienteIdFinal && !destinatarioFinal) {
        const cli = clientesQuery.data?.find((c) => c.id === clienteIdFinal);
        if (cli?.nome) destinatarioFinal = cli.nome;
      }

      const payload: any = {
        empresa_id: empresa.id,
        venda_id: formVendaId || null,
        cliente_id: clienteIdFinal,
        destinatario: destinatarioFinal,
        data_prevista: formDataPrevista || null,
        data_realizada: formDataRealizada || null,
        status: formStatus,
        custo_reposicao: formStatus === "reposicao" ? Number(formCustoReposicao.replace(",", ".")) || 0 : null,
        observacoes: formObservacoes.trim() || null,
        atualizado_por: session?.user.id ?? null,
      };

      if (entregaEditando) {
        const { error } = await supabase
          .from("entregas")
          .update(payload)
          .eq("id", entregaEditando.id);
        if (error) throw error;
      } else {
        payload.criado_por = session?.user.id ?? null;
        const { error } = await supabase.from("entregas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(entregaEditando ? "Entrega atualizada com sucesso!" : "Entrega criada com sucesso!");
      fecharModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const excluirEntrega = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entregas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Entrega excluída com sucesso.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const abrirNovo = () => {
    setEntregaEditando(null);
    setFormVendaId("");
    setFormClienteId("");
    setFormDestinatario("");
    setFormDataPrevista(new Date().toISOString().slice(0, 10));
    setFormDataRealizada("");
    setFormStatus("pendente");
    setFormCustoReposicao("0");
    setFormObservacoes("");
    setModalAberto(true);
  };

  const abrirEdicao = (entrega: Entrega) => {
    setEntregaEditando(entrega);
    setFormVendaId(entrega.venda_id || "");
    setFormClienteId(entrega.cliente_id || "");
    setFormDestinatario(entrega.destinatario || "");
    setFormDataPrevista(entrega.data_prevista ? entrega.data_prevista.substring(0, 10) : "");
    setFormDataRealizada(entrega.data_realizada ? entrega.data_realizada.substring(0, 10) : "");
    setFormStatus(entrega.status || "pendente");
    setFormCustoReposicao(entrega.custo_reposicao?.toString() || "0");
    setFormObservacoes(entrega.observacoes || "");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setTimeout(() => setEntregaEditando(null), 300);
  };

  const extrairNomeCliente = (entrega: Entrega) => {
    const nomeVendaDireto = entrega.vendas?.cliente?.trim();
    const nomeClienteVenda = entrega.vendas?.clientes?.nome?.trim();
    const nomeClienteEntrega = entrega.clientes?.nome?.trim();
    const destinatario = entrega.destinatario?.trim();

    return nomeVendaDireto || nomeClienteVenda || nomeClienteEntrega || destinatario || null;
  };

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Entregas"
        descricao="Programação e acompanhamento das entregas aos clientes."
        acoes={
          temPermissao("entregas", "criar") && (
            <BotaoAdicionar
              modulo="Entregas"
              rotulo="Adicionar entrega"
              aoClicar={abrirNovo}
            />
          )
        }
      />

      <div className="flex justify-end">
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Filtrar por status">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_OPCOES.map((s) => (
              <SelectItem key={s.valor} value={s.valor}>
                {s.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {consulta.isLoading ? (
          <div className="p-4">
            <CarregandoTabela colunas={6} />
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
              icone={<Truck className="size-5" aria-hidden="true" />}
              titulo="Nenhuma entrega programada"
              descricao="Programe a primeira entrega ou cadastre uma venda para acompanhar prazos e status."
              className="border-0"
              acao={
                temPermissao("entregas", "criar") ? (
                  <Button onClick={abrirNovo}>Adicionar entrega</Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[48px] text-center" title="Checklist de conclusão rápida">
                    OK
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead className="hidden md:table-cell">Data Realizada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Custo Repos.</TableHead>
                  <TableHead className="w-[160px] text-center">Ações Rápidas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.map((entrega) => {
                  const nomeCliente = extrairNomeCliente(entrega);
                  const isEntregue = entrega.status === "entregue";

                  return (
                    <TableRow
                      key={entrega.id}
                      className={cn(
                        "transition-colors hover:bg-white/[0.02]",
                        isEntregue && "bg-emerald-950/[0.08]"
                      )}
                    >
                      {/* 1. Checklist / Círculo de Status */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alternarStatus.mutate({ id: entrega.id, statusAtual: entrega.status });
                          }}
                          className="group flex items-center justify-center size-8 mx-auto rounded-full hover:bg-white/5 transition-colors focus:outline-none"
                          title={
                            isEntregue
                              ? "Entrega concluída! Clique para reverter para Pendente"
                              : "Clique para concluir a entrega"
                          }
                          aria-label={isEntregue ? "Concluído" : "Pendente"}
                        >
                          {isEntregue ? (
                            <CheckCircle2 className="size-5 text-emerald-400 fill-emerald-500/20 group-hover:scale-110 transition-transform" />
                          ) : (
                            <Circle className="size-5 text-zinc-500 group-hover:text-emerald-400 group-hover:scale-110 transition-transform" />
                          )}
                        </button>
                      </TableCell>

                      {/* 2. Cliente com Tratamento Seguro, Linha Secundária e Observações */}
                      <TableCell>
                        <div className="flex flex-col max-w-[240px]">
                          {nomeCliente ? (
                            <span
                              className="truncate font-medium text-white block"
                              title={nomeCliente}
                            >
                              {nomeCliente}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70 italic text-xs">
                              Cliente não informado
                            </span>
                          )}

                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {entrega.vendas?.numero ? (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                Venda #{entrega.vendas.numero}
                              </span>
                            ) : null}

                            {entrega.observacoes ? (
                              <span
                                className="text-[11px] text-muted-foreground/80 italic truncate max-w-[200px] block"
                                title={`Obs: ${entrega.observacoes}`}
                              >
                                Obs: {entrega.observacoes}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Data Prevista */}
                      <TableCell className="num">
                        {entrega.data_prevista ? formatarData(entrega.data_prevista, fuso) : "—"}
                      </TableCell>

                      {/* 4. Data Realizada */}
                      <TableCell className="hidden md:table-cell num text-muted-foreground">
                        {entrega.data_realizada ? (
                          <span className="text-emerald-400 font-medium">
                            {formatarData(entrega.data_realizada, fuso)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* 5. Badge de Status */}
                      <TableCell>
                        <SeloStatusEntrega status={entrega.status} />
                      </TableCell>

                      {/* 6. Custo Reposição */}
                      <TableCell className="hidden lg:table-cell num text-right font-medium">
                        {entrega.custo_reposicao ? formatarMoeda(entrega.custo_reposicao) : "—"}
                      </TableCell>

                      {/* 7. Coluna de Ações Rápidas (Checklist OK, Observação, Lápis, Excluir) */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {/* Botão de Confirmação OK */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isEntregue}
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarEntregue.mutate(entrega.id);
                            }}
                            className={cn(
                              "size-8 transition-colors",
                              isEntregue
                                ? "text-emerald-500/30 cursor-default"
                                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                            )}
                            title={isEntregue ? "Já confirmado como entregue" : "Confirmar Entrega (OK)"}
                            aria-label="Confirmar entrega"
                          >
                            <Check className="size-4 stroke-[2.5]" />
                          </Button>

                          {/* Notas Rápidas / Observação com Popover */}
                          <BotaoObservacaoRapida
                            entregaId={entrega.id}
                            observacaoAtual={entrega.observacoes}
                            onSalvar={async (id, obs) => {
                              await salvarNota.mutateAsync({ id, observacoes: obs });
                            }}
                          />

                          {/* Botão de Edição Rápida (Lápis) */}
                          {temPermissao("entregas", "editar") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirEdicao(entrega);
                              }}
                              className="size-8 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                              title="Editar entrega"
                              aria-label="Editar entrega"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}

                          {/* Botão de Excluir */}
                          {temPermissao("entregas", "excluir") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => e.stopPropagation()}
                                  className="size-8 text-muted-foreground hover:bg-red-950/30 hover:text-red-400 transition-colors"
                                  title="Excluir entrega"
                                  aria-label="Excluir entrega"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir entrega?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação removerá permanentemente o registro de entrega do sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => excluirEntrega.mutate(entrega.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Confirmar Exclusão
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal Completo de Criação / Edição de Entrega */}
      <Dialog open={modalAberto} onOpenChange={(v) => !v && fecharModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {entregaEditando ? "Editar Entrega" : "Nova Entrega"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados de programação ou acompanhamento da entrega.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Venda vinculada */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Venda Vinculada (opcional)</Label>
              <Select
                value={formVendaId}
                onValueChange={(val) => {
                  setFormVendaId(val);
                  if (val) {
                    const venda = vendasQuery.data?.find((v) => v.id === val);
                    if (venda) {
                      if (venda.cliente_id) setFormClienteId(venda.cliente_id);
                      const nome = venda.cliente || (venda.clientes as any)?.nome || "";
                      if (nome) setFormDestinatario(nome);
                      if (venda.data_entrega_prevista) {
                        setFormDataPrevista(venda.data_entrega_prevista.substring(0, 10));
                      }
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma venda para vincular..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma venda vinculada</SelectItem>
                  {(vendasQuery.data ?? []).map((v) => {
                    const cli = v.cliente || (v.clientes as any)?.nome || "";
                    return (
                      <SelectItem key={v.id} value={v.id}>
                        Venda #{v.numero} {cli ? `— ${cli}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Cliente */}
            <div className="space-y-1.5">
              <Label>Cliente Cadastrado</Label>
              <Select
                value={formClienteId}
                onValueChange={(val) => {
                  setFormClienteId(val);
                  if (val && !formDestinatario) {
                    const cli = clientesQuery.data?.find((c) => c.id === val);
                    if (cli?.nome) setFormDestinatario(cli.nome);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Selecione...</SelectItem>
                  {(clientesQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destinatário / Nome Manual */}
            <div className="space-y-1.5">
              <Label htmlFor="destinatario">Destinatário / Cliente Avulso</Label>
              <Input
                id="destinatario"
                value={formDestinatario}
                onChange={(e) => setFormDestinatario(e.target.value)}
                placeholder="Nome do cliente ou destinatário"
              />
            </div>

            {/* Data Prevista */}
            <div className="space-y-1.5">
              <Label htmlFor="data-prevista">Data Prevista</Label>
              <Input
                id="data-prevista"
                type="date"
                value={formDataPrevista}
                onChange={(e) => setFormDataPrevista(e.target.value)}
              />
            </div>

            {/* Data Realizada */}
            <div className="space-y-1.5">
              <Label htmlFor="data-realizada">Data Realizada</Label>
              <Input
                id="data-realizada"
                type="date"
                value={formDataRealizada}
                onChange={(e) => setFormDataRealizada(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={formStatus}
                onValueChange={(val) => {
                  setFormStatus(val);
                  if (val === "entregue" && !formDataRealizada) {
                    setFormDataRealizada(new Date().toISOString().slice(0, 10));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPCOES.map((s) => (
                    <SelectItem key={s.valor} value={s.valor}>
                      {s.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custo de Reposição (se status === reposicao) */}
            {formStatus === "reposicao" && (
              <div className="space-y-1.5">
                <Label htmlFor="custo-reposicao">Custo da Reposição (R$)</Label>
                <Input
                  id="custo-reposicao"
                  value={formCustoReposicao}
                  onChange={(e) => setFormCustoReposicao(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            )}

            {/* Observações */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={3}
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                placeholder="Instruções de entrega, endereço ou notas adicionais..."
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvarEntregaCompleta.mutate()}
              disabled={salvarEntregaCompleta.isPending}
            >
              {salvarEntregaCompleta.isPending
                ? "Salvando..."
                : entregaEditando
                ? "Salvar Alterações"
                : "Criar Entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
