import React from "react";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LIMITES_BM_PADRAO = ["250", "2k", "10k", "100k"] as const;

export const STATUS_ENVIO_PADRAO = [
  { valor: "disponivel", rotulo: "Disponível" },
  { valor: "em_farm", rotulo: "Em Farm" },
  { valor: "pronta_envio", rotulo: "Pronta para Envio" },
  { valor: "pendente", rotulo: "Pendente" },
  { valor: "reservada", rotulo: "Reservada" },
  { valor: "enviada", rotulo: "Enviada" },
];

export type BmOperationalData = {
  nomeBm: string;
  nomesBm?: string[];
  limiteBm: string;
  temTemplate: boolean;
  dataCriacao: string;
  responsavel: string;
  destinatario: string;
  statusEnvio: string;
  quantidade?: string | number;
  custoMedio?: string;
};

export interface BmOperationalFormProps {
  data: BmOperationalData;
  onChange: <K extends keyof BmOperationalData>(field: K, value: BmOperationalData[K]) => void;
  equipeOptions?: { id: string; nome: string }[];
  clientesOptions?: { id: string; nome: string }[];
  statusOptions?: { valor: string; rotulo: string }[];
  mostrarQuantidade?: boolean;
  mostrarCusto?: boolean;
  permitirMultiplosNomes?: boolean;
  datalistSuffix?: string;
}

export function BmOperationalForm({
  data,
  onChange,
  equipeOptions = [],
  clientesOptions = [],
  statusOptions = STATUS_ENVIO_PADRAO,
  mostrarQuantidade = true,
  mostrarCusto = false,
  permitirMultiplosNomes = true,
  datalistSuffix = "bm",
}: BmOperationalFormProps) {
  const listaRespId = `lista-resp-${datalistSuffix}`;
  const listaDestId = `lista-dest-${datalistSuffix}`;

  // Lista dinâmica de nomes de BMs
  const listaNomes = React.useMemo(() => {
    if (data.nomesBm && data.nomesBm.length > 0) {
      return data.nomesBm;
    }
    return [data.nomeBm || ""];
  }, [data.nomesBm, data.nomeBm]);

  const atualizarListaNomes = (novaLista: string[]) => {
    const listaLimpa = novaLista.length > 0 ? novaLista : [""];
    onChange("nomesBm", listaLimpa);
    onChange("nomeBm", listaLimpa[0] || "");
    const preenchidos = listaLimpa.filter((n) => n.trim().length > 0).length;
    onChange("quantidade", String(Math.max(1, preenchidos || 1)));
  };

  const handleNomeChange = (index: number, valor: string) => {
    // Se o usuário colou texto com quebras de linha
    if (valor.includes("\n")) {
      const linhas = valor.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (linhas.length > 1) {
        const nova = [...listaNomes];
        nova.splice(index, 1, ...linhas);
        atualizarListaNomes(nova);
        return;
      }
    }
    const nova = [...listaNomes];
    nova[index] = valor;
    atualizarListaNomes(nova);
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const textoColado = e.clipboardData.getData("text");
    if (textoColado && textoColado.includes("\n")) {
      e.preventDefault();
      const linhas = textoColado.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (linhas.length > 0) {
        const nova = [...listaNomes];
        nova.splice(index, 1, ...linhas);
        atualizarListaNomes(nova);
      }
    }
  };

  const adicionarLinhaNome = () => {
    const nova = [...listaNomes, ""];
    atualizarListaNomes(nova);
  };

  const removerLinhaNome = (index: number) => {
    if (listaNomes.length <= 1) {
      atualizarListaNomes([""]);
      return;
    }
    const nova = listaNomes.filter((_, i) => i !== index);
    atualizarListaNomes(nova);
  };

  return (
    <div className="space-y-4 rounded-xl border border-blue-500/20 bg-blue-950/10 p-4">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/40 text-blue-400 font-semibold text-xs uppercase tracking-wider">
        <Sparkles className="size-4 shrink-0 text-blue-400" />
        <span>CONTROLE OPERACIONAL DE BM</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Nome da BM - Lista dinâmica com suporte a múltiplos itens */}
        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`bm-nome-${datalistSuffix}-0`} className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span>{listaNomes.length > 1 ? `Nomes das BMs (${listaNomes.length})` : "Nome da BM"}</span>
              <span className="text-[10px] font-normal text-muted-foreground">(cole múltiplas linhas para lote)</span>
            </Label>
            {permitirMultiplosNomes && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarLinhaNome}
                className="h-6 px-2 text-[11px] gap-1 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-white"
                title="Adicionar mais um nome de BM"
              >
                <Plus className="size-3" />
                <span>+ Adicionar BM</span>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {listaNomes.map((nome, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  id={`bm-nome-${datalistSuffix}-${index}`}
                  placeholder={listaNomes.length > 1 ? `BM ${index + 1} (Ex: BM Matriz 0${index + 1})` : "Ex: BM Matriz 01"}
                  value={nome}
                  onChange={(e) => handleNomeChange(index, e.target.value)}
                  onPaste={(e) => handlePaste(index, e)}
                  className="bg-background/60 h-9 text-xs"
                />
                {listaNomes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removerLinhaNome(index)}
                    className="size-9 shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    title="Remover este nome"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STATUS / LIMITE DA BM (Segmented Control / Botões Selecionáveis) */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            STATUS / LIMITE DA BM
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {LIMITES_BM_PADRAO.map((lim) => {
              const ativo = (data.limiteBm || "").toLowerCase() === lim.toLowerCase();
              return (
                <button
                  key={lim}
                  type="button"
                  onClick={() => onChange("limiteBm", lim)}
                  className={`
                    py-2 px-2 rounded-lg text-xs font-bold transition-all border
                    ${ativo
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }
                  `}
                >
                  {lim}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template (Switch Toggle Sim / Não) */}
        <div className="flex items-center justify-between sm:col-span-2 rounded-lg border border-border/50 bg-background/50 p-3">
          <div className="space-y-0.5">
            <Label htmlFor={`bm-template-${datalistSuffix}`} className="text-sm font-semibold cursor-pointer">
              Template
            </Label>
            <p className="text-xs text-muted-foreground">
              Está com template configurado?
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${data.temTemplate ? "text-emerald-400" : "text-muted-foreground"}`}>
              {data.temTemplate ? "Sim" : "Não"}
            </span>
            <Switch
              id={`bm-template-${datalistSuffix}`}
              checked={data.temTemplate}
              onCheckedChange={(checked) => onChange("temTemplate", checked)}
            />
          </div>
        </div>

        {/* Data de Criação */}
        <div className="space-y-1.5">
          <Label htmlFor={`bm-data-criacao-${datalistSuffix}`} className="text-xs font-medium">
            Data de Criação
          </Label>
          <Input
            id={`bm-data-criacao-${datalistSuffix}`}
            type="date"
            value={data.dataCriacao}
            onChange={(e) => onChange("dataCriacao", e.target.value)}
            className="bg-background/60"
          />
        </div>

        {/* Status de Envio / Etapa da Produção */}
        <div className="space-y-1.5">
          <Label htmlFor={`bm-status-envio-${datalistSuffix}`} className="text-xs font-medium">
            Status de Envio / Etapa
          </Label>
          <Select
            value={data.statusEnvio}
            onValueChange={(val) => onChange("statusEnvio", val)}
          >
            <SelectTrigger id={`bm-status-envio-${datalistSuffix}`} className="bg-background/60">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((st) => (
                <SelectItem key={st.valor} value={st.valor}>
                  {st.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Criador / Responsável */}
        <div className="space-y-1.5">
          <Label htmlFor={`bm-resp-${datalistSuffix}`} className="text-xs font-medium">
            Criador / Responsável
          </Label>
          <div className="relative">
            <Input
              id={`bm-resp-${datalistSuffix}`}
              list={listaRespId}
              placeholder="Quem fez essa BM..."
              value={data.responsavel}
              onChange={(e) => onChange("responsavel", e.target.value)}
              className="bg-background/60"
            />
            {equipeOptions.length > 0 && (
              <datalist id={listaRespId}>
                {equipeOptions.map((m) => (
                  <option key={m.id} value={m.nome} />
                ))}
              </datalist>
            )}
          </div>
        </div>

        {/* Destinatário / Cliente */}
        <div className="space-y-1.5">
          <Label htmlFor={`bm-dest-${datalistSuffix}`} className="text-xs font-medium">
            Destinatário / Cliente
          </Label>
          <div className="relative">
            <Input
              id={`bm-dest-${datalistSuffix}`}
              list={listaDestId}
              placeholder="Para quem vai ser enviada..."
              value={data.destinatario}
              onChange={(e) => onChange("destinatario", e.target.value)}
              className="bg-background/60"
            />
            {clientesOptions.length > 0 && (
              <datalist id={listaDestId}>
                {clientesOptions.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            )}
          </div>
        </div>

        {/* Quantidade */}
        {mostrarQuantidade && (
          <div className="space-y-1.5">
            <Label htmlFor={`bm-qtd-${datalistSuffix}`} className="text-xs font-medium">
              Quantidade
            </Label>
            <Input
              id={`bm-qtd-${datalistSuffix}`}
              type="number"
              min="1"
              value={data.quantidade ?? "1"}
              onChange={(e) => onChange("quantidade", e.target.value)}
              className="bg-background/60"
            />
          </div>
        )}

        {/* Custo Unitário (se habilitado) */}
        {mostrarCusto && (
          <div className="space-y-1.5">
            <Label htmlFor={`bm-custo-${datalistSuffix}`} className="text-xs font-medium">
              Custo Unitário (R$)
            </Label>
            <Input
              id={`bm-custo-${datalistSuffix}`}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={data.custoMedio ?? "0"}
              onChange={(e) => onChange("custoMedio", e.target.value)}
              className="bg-background/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}
