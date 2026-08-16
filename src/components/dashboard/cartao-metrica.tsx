import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Cartão de KPI do painel: rótulo e valor destacado. */
export function CartaoMetrica({
  rotulo,
  valor,
  detalhe,
  destaque = false,
  positivo = false,
  className,
  corValor,
  explicacao,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
  positivo?: boolean;
  className?: string;
  corValor?: string;
  explicacao?: string;
}) {
  const content = (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 sm:p-6 shadow-panel transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold text-slate-200">{rotulo}</p>
        {explicacao && (
          <Info className="size-3.5 text-slate-200/50" />
        )}
      </div>

      <p
        className={cn(
          "num mt-1.5 sm:mt-3 font-semibold tracking-tight",
          destaque ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl",
          corValor || (positivo ? "text-success" : "text-foreground"),
        )}
      >
        {valor}
      </p>
      {detalhe ? <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );

  if (explicacao) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] text-xs">
            {explicacao}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
