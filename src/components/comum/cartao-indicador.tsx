import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TomIndicador = "neutro" | "positivo" | "negativo" | "alerta";

const TOM_VALOR: Record<TomIndicador, string> = {
  neutro: "text-foreground",
  positivo: "text-success",
  negativo: "text-destructive",
  alerta: "text-warning-foreground",
};

const TOM_ICONE: Record<TomIndicador, string> = {
  neutro: "bg-muted text-muted-foreground",
  positivo: "bg-success-soft text-success",
  negativo: "bg-danger-soft text-destructive",
  alerta: "bg-warning-soft text-warning-foreground",
};

export function CartaoIndicador({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
  icone: Icone,
  rodape,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  tom?: TomIndicador;
  icone?: LucideIcon;
  rodape?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
        {Icone ? (
          <span className={cn("flex size-8 items-center justify-center rounded-md", TOM_ICONE[tom])}>
            <Icone className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className={cn("num mt-2 text-2xl font-semibold tracking-tight", TOM_VALOR[tom])}>{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
      {rodape ? <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">{rodape}</div> : null}
    </div>
  );
}
