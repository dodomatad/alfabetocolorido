import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
  { valor: "confirmada", rotulo: "Confirmada" },
] as const;

export function FormularioVenda({
  aberto,
  aoFechar,
}: {
  aberto: boolean;
  aoFechar: () => void;
}) {
  const { empresa, usuario } = useSessao();
  const queryClient = useQueryClient();

  const [clienteId, setClienteId] = useState("");
  const [status, setStatus] = useState<string>("rascunho");
  const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataEntrega, setDataEntrega] = useState("");
  const [desconto, setDesconto] = useState("0");
  const [acrescimo, setAcrescimo] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<Item[]>([{ ...ITEM_VAZIO }]);

  const clientes = useQuery({
    queryKey: ["clientes-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
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

  const modalidades = useQuery({
    queryKey: ["modalidades-selecao", empresa?.id],
    enabled: Boolean(empresa?.id) && aberto,
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

  const subtotal = itens.reduce(
    (acc, i) => acc + numero(i.quantidade) * numero(i.preco_unitario),
    0,
  );
  const total = subtotal - numero(desconto) + numero(acrescimo);

  const limpar = () => {
    setClienteId("");
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

      const { data: proximo, error: erroNumero } = await supabase.rpc("proximo_numero_venda", {
        _empresa: empresa.id,
      });
      if (erroNumero) throw erroNumero;

      const { data: venda, error: erroVenda } = await supabase
        .from("vendas")
        .insert({
          empresa_id: empresa.id,
          cliente_id: clienteId || null,
          numero: proximo ?? 1,
          data_venda: dataVenda,
          data_entrega_prevista: dataEntrega || null,
          status: status as "rascunho" | "confirmada",
          subtotal,
          desconto: numero(desconto),
          acrescimo: numero(acrescimo),
          valor_total: total,
          observacoes: observacoes.trim() || null,
          criado_por: usuario?.id ?? null,
          atualizado_por: usuario?.id ?? null,
        })
        .select("id")
        .single();
      if (erroVenda) throw erroVenda;

      const { error: erroItens } = await supabase.from("venda_itens").insert(
        validos.map((i) => ({
          venda_id: venda.id,
          modalidade_id: i.modalidade_id,
          quantidade: numero(i.quantidade),
          preco_unitario: numero(i.preco_unitario),
          desconto: 0,
          valor_total: numero(i.quantidade) * numero(i.preco_unitario),
        })),
      );
      if (erroItens) throw erroItens;
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
          <DialogDescription>
            Informe o cliente, os itens por modalidade e os valores do pedido.
          </DialogDescription>
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
            <div key={indice} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_90px_120px_auto]">
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
                <SelectTrigger aria-label="Modalidade">
                  <SelectValue
                    placeholder={modalidades.isLoading ? "Carregando..." : "Modalidade"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(modalidades.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.codigo} — {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                aria-label="Quantidade"
                inputMode="decimal"
                value={item.quantidade}
                onChange={(e) =>
                  setItens((a) =>
                    a.map((i, x) => (x === indice ? { ...i, quantidade: e.target.value } : i)),
                  )
                }
              />
              <Input
                aria-label="Preço unitário"
                inputMode="decimal"
                value={item.preco_unitario}
                onChange={(e) =>
                  setItens((a) =>
                    a.map((i, x) => (x === indice ? { ...i, preco_unitario: e.target.value } : i)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover item"
                onClick={() => setItens((a) => (a.length === 1 ? a : a.filter((_, x) => x !== indice)))}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
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

        <div className="flex items-center justify-between rounded-lg border bg-secondary px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Subtotal {formatarMoeda(subtotal)}
          </span>
          <span className="font-semibold">Total {formatarMoeda(total)}</span>
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
