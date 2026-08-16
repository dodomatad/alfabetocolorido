import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Cartão de KPI do painel: rótulo, valor destacado e explicação em tooltip. */
export function CartaoMetrica({
  rotulo,
  valor,
  detalhe,
  explicacao,
  destaque = false,
  positivo = false,
  className,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  explicacao: string;
  destaque?: boolean;
  positivo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-panel transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label={`Sobre ${rotulo}`}
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="size-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent className="max-w-60">{explicacao}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p
        className={cn(
          "num mt-3 font-semibold tracking-tight",
          destaque ? "text-3xl sm:text-4xl" : "text-2xl",
          positivo ? "text-success" : "text-foreground",
        )}
      >
        {valor}
      </p>
      {detalhe ? <p className="mt-2 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}
