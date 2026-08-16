import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CarregandoTabela({ linhas = 5, colunas = 4 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando informações</span>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}>
          {Array.from({ length: colunas }).map((__, j) => (
            <Skeleton key={j} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CarregandoCartoes({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: quantidade }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function EstadoVazio({
  titulo,
  descricao,
  acao,
  icone,
  className,
}: {
  titulo: string;
  descricao: string;
  acao?: ReactNode;
  icone?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icone ?? <Inbox className="size-5" aria-hidden="true" />}
      </div>
      <h3 className="mt-4 text-base font-semibold">{titulo}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{descricao}</p>
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}

export function EstadoErro({
  titulo = "Não foi possível carregar os dados",
  descricao,
  aoTentarNovamente,
}: {
  titulo?: string;
  descricao?: string;
  aoTentarNovamente?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-destructive/40 bg-danger-soft px-6 py-12 text-center"
    >
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-foreground">{titulo}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {descricao ?? "Verifique sua conexão e tente novamente. Se o erro continuar, avise o administrador."}
      </p>
      {aoTentarNovamente ? (
        <Button variant="outline" className="mt-5" onClick={aoTentarNovamente}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

export function SemPermissao({ recurso }: { recurso: string }) {
  return (
    <EstadoVazio
      icone={<AlertTriangle className="size-5" aria-hidden="true" />}
      titulo="Acesso restrito"
      descricao={`Seu papel de acesso não permite consultar ${recurso}. Solicite a liberação ao administrador da empresa.`}
    />
  );
}
