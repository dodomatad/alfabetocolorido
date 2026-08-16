import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";

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

  const podeVoltar = router.state.location.pathname !== "/";
  const permitido = modulo ? temPermissao(modulo, acaoObrigatoria) : true;

  if (!permitido) return null;


  return (
    <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        {mostrarBotaoVoltar && podeVoltar && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{titulo}</h1>
          {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
        </div>
      </div>
      {acoes ? <div className="flex flex-wrap items-center gap-2">{acoes}</div> : null}
    </header>
  );
}
