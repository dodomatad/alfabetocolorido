import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { useSessao } from "@/hooks/use-sessao";


export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
  mostrarBotaoVoltar = true,
  modulo,
  acaoObrigatoria = 'visualizar',
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  mostrarBotaoVoltar?: boolean;
  modulo?: string;
  acaoObrigatoria?: 'visualizar' | 'criar' | 'editar' | 'excluir';
}) {
  const router = useRouter();
  const { temPermissao } = useSessao();

  const podeVoltar = mostrarBotaoVoltar && router.state.location.pathname !== "/";
  const permitido = modulo ? temPermissao(modulo, acaoObrigatoria) : true;
  
  const temPermissaoCriar = modulo ? temPermissao(modulo, 'criar') : true;

  if (!permitido) return null;


  return (
    <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        {mostrarBotaoVoltar && podeVoltar && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 p-2 -ml-2 text-blue-400 hover:text-blue-300 hover:bg-white/10 shrink-0"
            onClick={() => router.navigate({ to: "/" })}
            aria-label="Voltar para o Dashboard"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl truncate">{titulo}</h1>
          {descricao ? <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{descricao}</p> : null}
        </div>
      </div>
      {acoes && temPermissaoCriar ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
          {acoes}
        </div>
      ) : null}
    </header>
  );
}
