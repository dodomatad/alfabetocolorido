import { AlertTriangle, Ban, CheckCircle2, CircleDashed, Clock, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type TomSelo = "neutro" | "positivo" | "negativo" | "alerta" | "info";

const TOM: Record<TomSelo, string> = {
  neutro: "bg-muted text-muted-foreground border-border",
  positivo: "bg-success-soft text-success border-success/30",
  negativo: "bg-danger-soft text-destructive border-destructive/30",
  alerta: "bg-warning-soft text-warning-foreground border-warning/40",
  info: "bg-info-soft text-info border-info/30",
};

export function SeloStatus({
  rotulo,
  tom = "neutro",
  icone: Icone,
}: {
  rotulo: string;
  tom?: TomSelo;
  icone?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TOM[tom],
      )}
    >
      {Icone ? <Icone className="size-3.5" aria-hidden="true" /> : null}
      {rotulo}
    </span>
  );
}

const STATUS_VENDA: Record<string, { rotulo: string; tom: TomSelo; icone: LucideIcon }> = {
  rascunho: { rotulo: "Rascunho", tom: "neutro", icone: CircleDashed },
  em_andamento: { rotulo: "Em andamento", tom: "alerta", icone: Clock },
  efetuada: { rotulo: "Efetuada", tom: "positivo", icone: CheckCircle2 },
  falta_pagamento: { rotulo: "Falta pagamento", tom: "alerta", icone: AlertTriangle },
  confirmada: { rotulo: "Confirmada", tom: "info", icone: CheckCircle2 },
  em_producao: { rotulo: "Em produção", tom: "alerta", icone: Clock },
  pronta: { rotulo: "Pronta", tom: "info", icone: CheckCircle2 },
  parcialmente_entregue: { rotulo: "Parcialmente entregue", tom: "alerta", icone: Truck },
  entregue: { rotulo: "Entregue", tom: "positivo", icone: CheckCircle2 },
  cancelada: { rotulo: "Cancelada", tom: "negativo", icone: Ban },
};

export function SeloStatusVenda({ status }: { status: string }) {
  const cfg = STATUS_VENDA[status] ?? {
    rotulo: status,
    tom: "neutro" as TomSelo,
    icone: AlertTriangle,
  };
  return <SeloStatus rotulo={cfg.rotulo} tom={cfg.tom} icone={cfg.icone} />;
}

export function SeloAtivo({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <SeloStatus rotulo="Ativo" tom="positivo" icone={CheckCircle2} />
  ) : (
    <SeloStatus rotulo="Inativo" tom="neutro" icone={Ban} />
  );
}
