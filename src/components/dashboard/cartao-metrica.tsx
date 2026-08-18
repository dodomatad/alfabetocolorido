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
  icone: Icone,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
  positivo?: boolean;
  className?: string;
  corValor?: string;
  explicacao?: string;
  icone?: React.ElementType;
}) {
  const content = (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-4 sm:p-6 shadow-panel transition-all duration-300 hover:border-primary/60 hover:shadow-[0_15px_40px_-12px_rgba(0,102,255,0.4)] hover:-translate-y-1",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold text-white uppercase tracking-wider">{rotulo}</p>
        <div className="flex items-center gap-2">
          {explicacao && (
            <Info className="size-3.5 text-muted-foreground/50" />
          )}
          {Icone && (
            <Icone className="size-5 text-muted-foreground/20 absolute top-4 right-4" />
          )}
        </div>
      </div>

      <p
        className={cn(
          "num mt-1.5 sm:mt-3 font-bold tracking-tight text-2xl sm:text-3xl",
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
