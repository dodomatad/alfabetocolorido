import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
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
      
      const payloadVenda = {
          empresa_id: empresa.id,
          cliente_id: clienteId || null,
          responsavel_producao_id: funcionarioId === 'ciro-fornecedor' ? null : (funcionarioId || null),
          comissao_percentual: numero(percentualComissao),
          data_venda: dataVenda,
          data_entrega_prevista: dataEntrega || null,
          status: status as any,
          subtotal,
          desconto: numero(desconto),
          acrescimo: numero(acrescimo),
          valor_total: total,
          observacoes: (funcionarioId === 'ciro-fornecedor' ? '[FORNECEDOR_CIRO] ' : '') + (observacoes.trim() || ''),
          atualizado_por: session?.user.id ?? null,
      };

      if (vendaId) {
        // UPDATE
        const { error: erroVenda } = await supabase
          .from("vendas")
          .update(payloadVenda)
          .eq("id", vendaId);
        if (erroVenda) throw erroVenda;
        
        // Remove itens antigos
        await supabase.from("venda_itens").delete().eq("venda_id", vendaId);
      } else {
        // INSERT
        const { data: proximo, error: erroNumero } = await (supabase as any).rpc("proximo_numero_venda", {
          _empresa: empresa.id,
        });
        if (erroNumero) throw erroNumero;
        
        const { data: novaVenda, error: erroVenda } = await supabase
          .from("vendas")
          .insert({
            ...payloadVenda,
            numero: Number(proximo) || 1,
            status_entrega: "pendente",
            criado_por: session?.user.id ?? null,
          })
          .select("id")
          .single();
        if (erroVenda) throw erroVenda;
        vendaSalvaId = novaVenda.id;
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
      void queryClient.invalidateQueries({ queryKey: ["painel"] });
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
