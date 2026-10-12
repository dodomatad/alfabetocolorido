import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { formatarMoeda } from "@/lib/formatadores";

type Item = { modalidade_id: string; quantidade: string; preco_unitario: string };

const ITEM_VAZIO: Item = { modalidade_id: "", quantidade: "1", preco_unitario: "0" };

const STATUS_INICIAIS = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "efetuada", rotulo: "Efetuada" },
  { valor: "falta_pagamento", rotulo: "Falta pagamento" },
  { valor: "confirmada", rotulo: "Confirmada" },
  { valor: "reembolsada", rotulo: "Reembolsada" },
] as const;

export function FormularioVenda({
  aberto,
  aoFechar,
  vendaId,
}: {
  aberto: boolean;
  aoFechar: () => void;
  vendaId?: string | undefined;
}) {
  const { empresa, session } = useSessao();
  const queryClient = useQueryClient();

  const { data: ciroCriado, refetch: refetchCiro } = useQuery({
    queryKey: ["garantir-ciro", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: Infinity,
    queryFn: async () => {
      const { data: perfis } = await supabase
        .from("perfis")
        .select("id, nome")
        .eq("empresa_id", empresa?.id ?? "")
        .ilike("nome", "%ciro%");
      
      if (!perfis || perfis.length === 0) {
        // Criar o Ciro
        const { data: novoCiro, error } = await supabase.from("perfis").insert({
          nome: "Fornecedor CIRO",
          cargo: "Fornecedor BM",
          ativo: true,
          empresa_id: empresa?.id ?? ""
        } as any).select().single();
        
        if (!error && novoCiro) {
          queryClient.invalidateQueries({ queryKey: ["equipe-selecao"] });
          return novoCiro;
        }
      }
      return perfis?.[0] || null;
    }
  });


  const [clienteId, setClienteId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [percentualComissao, setPercentualComissao] = useState("0");
  const [status, setStatus] = useState<string>("rascunho");
  const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataEntrega, setDataEntrega] = useState("");
  const [desconto, setDesconto] = useState("0");
  const [acrescimo, setAcrescimo] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<"nao_enviado" | "entregue">("nao_enviado");
  const [itens, setItens] = useState<Item[]>([{ ...ITEM_VAZIO }]);
  const jaInicializadoRef = useRef(false);

  const consultaVenda = useQuery({
    queryKey: ["venda-edicao", vendaId],
    enabled: Boolean(vendaId) && aberto,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("*, venda_itens(*)")
        .eq("id", vendaId!)
        .single();
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!aberto) {
      jaInicializadoRef.current = false;
      return;
    }

    if (vendaId && consultaVenda.data) {
      const v = consultaVenda.data;
      setClienteId(v.cliente_id || "");
      
      let responsavelId = v.responsavel_producao_id || "";
      let obs = v.observacoes || "";
      if (obs.includes("[FORNECEDOR_CIRO]")) {
         responsavelId = "ciro-fornecedor";
         obs = obs.replace("[FORNECEDOR_CIRO]", "").trim();
      }
      
      setFuncionarioId(responsavelId);
      setPercentualComissao(v.comissao_percentual?.toString() || "0");
      setStatus(v.status || "rascunho");
      setDataVenda(v.data_venda ? v.data_venda.substring(0, 10) : new Date().toISOString().slice(0, 10));
      setDataEntrega(v.data_entrega_prevista ? v.data_entrega_prevista.substring(0, 10) : "");
      setDesconto(v.desconto?.toString() || "0");
      setAcrescimo(v.acrescimo?.toString() || "0");
      setObservacoes(obs);
      const stEntrega = String((v as any).delivery_status || (v as any).status_entrega || "");
      setDeliveryStatus(stEntrega.toLowerCase() === "entregue" ? "entregue" : "nao_enviado");

      if (v.venda_itens && v.venda_itens.length > 0) {
        setItens(v.venda_itens.map((i: any) => ({
          modalidade_id: i.modalidade_id || "",
          quantidade: i.quantidade?.toString() || "1",
          preco_unitario: i.preco_unitario?.toString() || "0",
        })));
      } else {
        setItens([{ ...ITEM_VAZIO }]);
      }
    } else if (!vendaId && !jaInicializadoRef.current) {
      jaInicializadoRef.current = true;
      setClienteId("");
      setFuncionarioId("");
      setPercentualComissao("0");
      setStatus("rascunho");
      setDataVenda(new Date().toISOString().slice(0, 10));
      setDataEntrega("");
      setDeliveryStatus("nao_enviado");
      setDesconto("0");
      setAcrescimo("0");
      setObservacoes("");
      setItens([{ ...ITEM_VAZIO }]);
    }
  }, [aberto, vendaId, consultaVenda.data]);

  const clientes = useQuery({
    queryKey: ["clientes-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
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

  const funcionarios = useQuery({
    queryKey: ["equipe-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const [perfis, membrosExtras] = await Promise.all([
        supabase.from("perfis").select("id, nome, cargo").eq("empresa_id", empresa?.id ?? "").eq("ativo", true).order("nome"),
        supabase.from("equipe_membros").select("id, nome, cargo").eq("empresa_id", empresa?.id ?? "").eq("status", "ativo").order("nome"),
      ]);
      
      const listaUnificada = [...(perfis.data ?? [])];
      (membrosExtras.data ?? []).forEach((m: any) => {
        if (!listaUnificada.find(p => p.id === m.id)) {
          listaUnificada.push(m);
        }
      });
      
      return listaUnificada;
    },
  });

  const modalidades = useQuery({
    queryKey: ["modalidades-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modalidades_bm")
        .select("id, nome, codigo, preco_venda_padrao")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const numero = (v: string) => {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const { subtotal, total } = useMemo(() => {
    const sub = itens.reduce(
      (acc, i) => acc + numero(i.quantidade) * numero(i.preco_unitario),
      0,
    );
    const tot = sub - numero(desconto) + numero(acrescimo);
    return { subtotal: sub, total: tot };
  }, [itens, desconto, acrescimo]);

  const limpar = () => {
    setClienteId("");
    setFuncionarioId("");
    setPercentualComissao("0");
    setStatus("rascunho");
    setDataVenda(new Date().toISOString().slice(0, 10));
    setDataEntrega("");
    setDeliveryStatus("nao_enviado");
    setDesconto("0");
    setAcrescimo("0");
    setObservacoes("");
    setItens([{ ...ITEM_VAZIO }]);
  };

  const salvar = useMutation({
    mutationFn: async () => {
      if (!empresa?.id) throw new Error("Empresa não identificada.");
      const validos = itens.filter((i) => i.modalidade_id && numero(i.quantidade) > 0);
      if (validos.length === 0) throw new Error("Adicione ao menos um item com modalidade e quantidade.");

      let vendaSalvaId: string = vendaId || "";
      const nomeCliente = (clientes.data ?? []).find((c) => c.id === clienteId)?.nome || null;
      const statusFinalEntrega = deliveryStatus === "entregue" ? "entregue" : "pendente";
      const dataRealizadaFinal = deliveryStatus === "entregue" ? (dataVenda || new Date().toISOString().slice(0, 10)) : null;
      
      const payloadVenda: any = {
          empresa_id: empresa.id,
          cliente_id: clienteId || null,
          cliente: nomeCliente,
          responsavel_producao_id: funcionarioId === 'ciro-fornecedor' ? null : (funcionarioId || null),
          comissao_percentual: numero(percentualComissao),
          data_venda: dataVenda,
          data_entrega_prevista: dataEntrega || null,
          status: status as any,
          status_entrega: statusFinalEntrega,
          delivery_status: deliveryStatus,
          subtotal,
          desconto: numero(desconto),
          acrescimo: numero(acrescimo),
          valor_total: total,
          observacoes: (funcionarioId === 'ciro-fornecedor' ? '[FORNECEDOR_CIRO] ' : '') + (observacoes.trim() || ''),
          atualizado_por: session?.user.id ?? null,
      };

      if (vendaId) {
        // UPDATE
        let { error: erroVenda } = await supabase
          .from("vendas")
          .update(payloadVenda)
          .eq("id", vendaId);
        
        // Se a coluna delivery_status não existir no banco remoto ainda, faz update sem ela
        if (erroVenda && (erroVenda.message?.includes("delivery_status") || (erroVenda as any).code === "PGRST204")) {
          const { delivery_status: _, ...payloadSemDeliveryStatus } = payloadVenda;
          const res = await supabase.from("vendas").update(payloadSemDeliveryStatus).eq("id", vendaId);
          erroVenda = res.error;
        }
        if (erroVenda) throw erroVenda;
        
        // Remove itens antigos
        await supabase.from("venda_itens").delete().eq("venda_id", vendaId);
      } else {
        // INSERT
        const { data: proximo, error: erroNumero } = await (supabase as any).rpc("proximo_numero_venda", {
          _empresa: empresa.id,
        });
        if (erroNumero) throw erroNumero;
        
        let novaVendaResult = await supabase
          .from("vendas")
          .insert({
            ...payloadVenda,
            numero: Number(proximo) || 1,
            criado_por: session?.user.id ?? null,
          })
          .select("id")
          .single();

        // Se a coluna delivery_status não existir no banco remoto ainda, insere sem ela
        if (novaVendaResult.error && (novaVendaResult.error.message?.includes("delivery_status") || (novaVendaResult.error as any).code === "PGRST204")) {
          const { delivery_status: _, ...payloadSemDeliveryStatus } = payloadVenda;
          novaVendaResult = await supabase
            .from("vendas")
            .insert({
              ...payloadSemDeliveryStatus,
              numero: Number(proximo) || 1,
              criado_por: session?.user.id ?? null,
            })
            .select("id")
            .single();
        }

        if (novaVendaResult.error) throw novaVendaResult.error;
        vendaSalvaId = novaVendaResult.data.id;
      }

      // Sincroniza / cadastra entrega vinculada à venda com cliente e destinatário corretos
      if (!vendaId) {
        // Nova venda: cria a entrega correspondente
        const { error: erroEntrega } = await supabase.from("entregas").insert({
          empresa_id: empresa.id,
          venda_id: vendaSalvaId,
          cliente_id: clienteId || null,
          destinatario: nomeCliente,
          data_prevista: dataEntrega || dataVenda || new Date().toISOString().slice(0, 10),
          status: statusFinalEntrega,
          data_realizada: dataRealizadaFinal,
          criado_por: session?.user.id ?? null,
        } as any);
        if (erroEntrega) {
          console.warn("Aviso ao vincular entrega na venda:", erroEntrega);
        }
      } else {
        // Edição de venda: atualiza a entrega vinculada se existir ou cria se não existir
        const { data: entregaExistente } = await supabase
          .from("entregas")
          .select("id")
          .eq("venda_id", vendaId)
          .maybeSingle();

        if (entregaExistente) {
          await supabase.from("entregas").update({
            cliente_id: clienteId || null,
            destinatario: nomeCliente,
            data_prevista: dataEntrega || dataVenda,
            status: statusFinalEntrega,
            data_realizada: dataRealizadaFinal,
            atualizado_por: session?.user.id ?? null,
          } as any).eq("id", entregaExistente.id);
        } else {
          await supabase.from("entregas").insert({
            empresa_id: empresa.id,
            venda_id: vendaId,
            cliente_id: clienteId || null,
            destinatario: nomeCliente,
            data_prevista: dataEntrega || dataVenda,
            status: statusFinalEntrega,
            data_realizada: dataRealizadaFinal,
            criado_por: session?.user.id ?? null,
          } as any);
        }
      }

      // Insere os novos itens
      const { error: erroItens } = await supabase.from("venda_itens").insert(
        validos.map((i) => ({
          venda_id: vendaSalvaId,
          modalidade_id: i.modalidade_id,
          quantidade: numero(i.quantidade),
          preco_unitario: numero(i.preco_unitario),
          desconto: 0,
          valor_total: numero(i.quantidade) * numero(i.preco_unitario),
        })),
      );
      if (erroItens) throw erroItens;

      // Baixa automática no estoque para os itens vendidos e registro de histórico se entregue
      for (const itemVenda of validos) {
        const mod = (modalidades.data ?? []).find((m) => m.id === itemVenda.modalidade_id);
        const qtdVendida = numero(itemVenda.quantidade);
        const nomeMod = mod?.nome || "BM";
        const codigoMod = mod?.codigo || "";

        // Tentar identificar o limite ou nome correspondente no estoque
        const limiteAlvo = (nomeMod.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] || codigoMod.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] || "").toUpperCase();

        try {
          // 1. Busca itens de estoque disponíveis correspondentes
          const { data: itensEstoqueDisp } = await supabase
            .from("estoque")
            .select("id, tipo_ativo, nome_bm, limite_bm, quantidade_disponivel, custo_medio_unitario")
            .eq("empresa_id", empresa.id)
            .gt("quantidade_disponivel", 0)
            .order("quantidade_disponivel", { ascending: true });

          if (itensEstoqueDisp && itensEstoqueDisp.length > 0) {
            // Encontra item que melhor corresponde ao limite ou tipo
            let estoqueCorrespondente = itensEstoqueDisp.find((e) => {
              const limE = (e.limite_bm || (e.tipo_ativo?.match(/\b(250|2K|10K|100K|Ilimitada)\b/i)?.[0] ?? "")).toUpperCase();
              return limiteAlvo && limE === limiteAlvo;
            }) || itensEstoqueDisp.find((e) => e.tipo_ativo.toLowerCase().includes(nomeMod.toLowerCase())) || itensEstoqueDisp[0];

            if (estoqueCorrespondente) {
              const novaQtd = Math.max(0, Number(estoqueCorrespondente.quantidade_disponivel) - qtdVendida);
              await supabase
                .from("estoque")
                .update({
                  quantidade_disponivel: novaQtd,
                  status: novaQtd === 0 ? "esgotado" : "em_estoque",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", estoqueCorrespondente.id);

              // 2. Se a venda ou entrega já for despachada/entregue ou tiver cliente definido, registra em contas_enviadas
              if (nomeCliente || deliveryStatus === "entregue" || status === "efetuada" || status === "confirmada") {
                await supabase.from("contas_enviadas").insert({
                  empresa_id: empresa.id,
                  bm_id: estoqueCorrespondente.id,
                  venda_id: vendaSalvaId,
                  nome_bm: estoqueCorrespondente.nome_bm || estoqueCorrespondente.tipo_ativo || nomeMod,
                  limite_bm: estoqueCorrespondente.limite_bm || limiteAlvo || null,
                  destinatario_cliente: nomeCliente || "Cliente da Venda",
                  responsavel_envio: (funcionarios.data ?? []).find((f) => f.id === funcionarioId)?.nome || null,
                  data_envio: dataRealizadaFinal || dataVenda || new Date().toISOString().slice(0, 10),
                  custo_unitario: estoqueCorrespondente.custo_medio_unitario || 0,
                  valor_venda: numero(itemVenda.preco_unitario),
                  status_envio: "enviada",
                } as any);
              }
            }
          }
        } catch (errEstoque) {
          console.warn("Aviso ao dar baixa automática no estoque:", errEstoque);
        }
      }

      // Só gerar lançamento financeiro se for uma NOVA venda (para evitar duplicidade na edição)
      const valorComissao = (subtotal * numero(percentualComissao)) / 100;
      if (!vendaId && funcionarioId && valorComissao > 0) {
        // Obter número temporário para descrição, já que proximo não está no escopo
        const numVenda = 0; // Só um placeholder, pois o real já foi inserido
        const { error: erroFinanceiro } = await supabase.from("lancamentos_financeiros").insert({
          empresa_id: empresa.id,
          tipo: "pagar",
          categoria: "Comissão / Repasse",
          descricao: `Comissão Venda - ${funcionarios.data?.find(f => f.id === funcionarioId)?.nome || 'Funcionária'}`,
          valor: valorComissao,
          data_vencimento: dataVenda,
          situacao: "aberto",
          observacoes: `Comissão de ${percentualComissao}% sobre subtotal de ${formatarMoeda(subtotal)}.`,
          criado_por: session?.user.id ?? null,
        });
        if (erroFinanceiro) {
          console.error("Erro ao gerar lançamento de comissão:", erroFinanceiro);
          toast.error("Venda salva, mas erro ao gerar comissão no financeiro.");
        }
      }
    },
    onSuccess: () => {
      toast.success("Venda registrada com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["vendas"] });
      void queryClient.invalidateQueries({ queryKey: ["entregas"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque"] });
      void queryClient.invalidateQueries({ queryKey: ["bm_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["estoque-lista"] });
      void queryClient.invalidateQueries({ queryKey: ["contas_enviadas"] });
      void queryClient.invalidateQueries({ queryKey: ["painel"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["financeiro-unificado"] });
      void queryClient.invalidateQueries({ queryKey: ["vendas-comissoes"] });
      limpar();
      aoFechar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar venda</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder={clientes.isLoading ? "Carregando..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent>

                {(clientes.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status inicial</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_INICIAIS.map((s) => (
                  <SelectItem key={s.valor} value={s.valor}>
                    {s.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data-venda">Data da venda</Label>
            <Input
              id="data-venda"
              type="date"
              value={dataVenda}
              onChange={(e) => setDataVenda(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data-entrega">Previsão de entrega</Label>
            <Input
              id="data-entrega"
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />
          </div>
        </div>

        {/* Status de Envio */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Status de envio
          </Label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => setDeliveryStatus("nao_enviado")}
              className={`
                flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all border
                ${deliveryStatus === "nao_enviado"
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-sm"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }
              `}
            >
              <Clock className="size-3.5 shrink-0 text-amber-500" />
              <span>Não enviado</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryStatus("entregue")}
              className={`
                flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all border
                ${deliveryStatus === "entregue"
                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-sm"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }
              `}
            >
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
              <span>Entregue</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Itens do pedido</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItens((a) => [...a, { ...ITEM_VAZIO }])}
            >
              <Plus className="size-4" aria-hidden="true" />
              Item
            </Button>
          </div>

          {itens.map((item, indice) => (
            <div 
              key={indice} 
              className="relative grid gap-3 rounded-2xl border border-[#27272A] bg-[#141417] p-4 shadow-sm md:grid-cols-3"
            >
              <div className="space-y-1.5 md:col-span-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Modalidade / Tipo de Conta
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Remover item"
                    onClick={() => setItens((a) => (a.length === 1 ? a : a.filter((_, x) => x !== indice)))}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <Select
                  value={item.modalidade_id}
                  onValueChange={(v) =>
                    setItens((a) =>
                      a.map((i, x) => {
                        if (x !== indice) return i;
                        const m = (modalidades.data ?? []).find((mm) => mm.id === v);
                        return {
                          ...i,
                          modalidade_id: v,
                          preco_unitario: m ? String(m.preco_venda_padrao) : i.preco_unitario,
                        };
                      }),
                    )
                  }
                >
                  <SelectTrigger className="h-10 bg-black/20">
                    <SelectValue
                      placeholder={modalidades.isLoading ? "Carregando..." : "Selecione a modalidade"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(modalidades.data ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qtd. de Contas
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ex: 1"
                  className="h-10 bg-black/20"
                  value={item.quantidade}
                  onChange={(e) =>
                    setItens((a) =>
                      a.map((i, x) => (x === indice ? { ...i, quantidade: e.target.value } : i)),
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor Unitário
                </Label>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  className="h-10 bg-black/20"
                  value={item.preco_unitario}
                  onChange={(e) =>
                    setItens((a) =>
                      a.map((i, x) => (x === indice ? { ...i, preco_unitario: e.target.value } : i)),
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subtotal
                </Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-black/40 px-3 text-sm font-medium text-blue-400">
                  {formatarMoeda(numero(item.quantidade) * numero(item.preco_unitario))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl my-3">
          <div className="space-y-1.5">
<Label className="text-xs font-semibold text-zinc-300 mb-1.5">
              Funcionária (Produção das Contas)
            </Label>
            <Select value={funcionarioId} onValueChange={setFuncionarioId}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder={funcionarios.isLoading ? "Carregando..." : "Selecione a funcionária"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ciro-fornecedor" className="font-semibold text-purple-400">
                  FORNECEDOR CIRO
                </SelectItem>
                {(funcionarios.data ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome} {f.cargo ? `(${f.cargo})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-300 mb-1.5">
              % Comissão / Repasse (%)
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="Ex: 10"
                value={percentualComissao}
                onChange={(e) => setPercentualComissao(e.target.value)}
                className="bg-zinc-950 border-zinc-800 pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs text-zinc-500 font-bold">%</span>
            </div>
            {subtotal > 0 && numero(percentualComissao) > 0 && (
              <span className="text-[11px] text-blue-400 mt-1 block">
                Comissão devida: {formatarMoeda((subtotal * numero(percentualComissao)) / 100)}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="desconto">Desconto (R$)</Label>
            <Input
              id="desconto"
              inputMode="decimal"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acrescimo">Acréscimo (R$)</Label>
            <Input
              id="acrescimo"
              inputMode="decimal"
              value={acrescimo}
              onChange={(e) => setAcrescimo(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal dos itens</span>
            <span>{formatarMoeda(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-blue-500/20 pt-2 text-lg font-bold text-white">
            <span>Valor Total do Pedido</span>
            <span className="text-blue-400">{formatarMoeda(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar} disabled={salvar.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
