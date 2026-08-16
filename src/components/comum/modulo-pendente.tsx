import { Hammer } from "lucide-react";

import { EstadoVazio } from "@/components/comum/estados";

/**
 * Estado honesto para módulos cuja estrutura de banco ainda não foi criada.
 * Não exibe números nem dados fictícios.
 */
export function ModuloPendente({
  modulo,
  proximaEtapa,
}: {
  modulo: string;
  proximaEtapa: string;
}) {
  return (
    <EstadoVazio
      icone={<Hammer className="size-5" aria-hidden="true" />}
      titulo={`${modulo} ainda não foi implantado`}
      descricao={`Nenhum dado é exibido aqui porque as tabelas deste módulo ainda não existem no banco. Próxima etapa: ${proximaEtapa}`}
    />
  );
}
