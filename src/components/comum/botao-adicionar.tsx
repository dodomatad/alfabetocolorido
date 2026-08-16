import { Plus } from "lucide-react";
import { useState } from "react";
import { useSessao } from "@/hooks/use-sessao";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Botão padrão "Adicionar" das abas.
 * Quando a aba ainda não possui formulário de cadastro liberado,
 * abre um aviso honesto explicando o que falta — sem simular gravação.
 */
export function BotaoAdicionar({
  rotulo = "Adicionar",
  modulo,
  proximaEtapa,
  aoClicar,
}: {
  rotulo?: string;
  modulo: string;
  proximaEtapa?: string;
  aoClicar?: () => void;
}) {
  const { temPermissao } = useSessao();
  const [aberto, setAberto] = useState(false);

  if (!temPermissao(modulo, 'criar')) return null;


  if (aoClicar) {
    return (
      <Button onClick={aoClicar}>
        <Plus className="size-4" aria-hidden="true" />
        {rotulo}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <Plus className="size-4" aria-hidden="true" />
        {rotulo}
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar em {modulo}</DialogTitle>
            <DialogDescription>
              O formulário de cadastro deste módulo ainda não está liberado, porque as tabelas
              correspondentes não existem no banco.
              {proximaEtapa ? ` Próxima etapa: ${proximaEtapa}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
