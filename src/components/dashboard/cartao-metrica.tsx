import { cn } from "@/lib/utils";

/** Cartão de KPI do painel: rótulo e valor destacado. */
export function CartaoMetrica({
  rotulo,
  valor,
  detalhe,
  destaque = false,
  positivo = false,
  className,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
  positivo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 sm:p-6 shadow-panel transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
      </div>

      <p
        className={cn(
          "num mt-1.5 sm:mt-3 font-semibold tracking-tight",
          destaque ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl",
          positivo ? "text-success" : "text-foreground",
        )}
      >
        {valor}
      </p>
      {detalhe ? <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}
