import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { BotaoAdicionar } from "@/components/comum/botao-adicionar";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { CarregandoTabela, EstadoErro, EstadoVazio } from "@/components/comum/estados";
import { SeloAtivo, SeloStatus } from "@/components/comum/selo-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROTULO_PAPEL, useSessao, type Papel } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe | Gestão BMs" },
      {
        name: "description",
        content: "Usuários da empresa com cargo, situação e papéis de acesso ao sistema interno.",
      },
      { property: "og:title", content: "Equipe | Gestão BMs" },
      { property: "og:description", content: "Usuários da empresa com cargo, situação e papéis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaEquipe,
});

function PaginaEquipe() {
  const { empresa } = useSessao();

  const consulta = useQuery({
    queryKey: ["equipe", empresa?.id],
    enabled: Boolean(empresa?.id),
    queryFn: async () => {
      const [perfis, vinculos] = await Promise.all([
        supabase.from("perfis").select("id, nome, email, cargo, ativo").order("nome"),
        supabase.from("usuarios_papeis").select("usuario_id, papel"),
      ]);
      if (perfis.error) throw perfis.error;
      if (vinculos.error) throw vinculos.error;

      const porUsuario = new Map<string, Papel[]>();
      for (const v of vinculos.data ?? []) {
        const lista = porUsuario.get(v.usuario_id) ?? [];
        lista.push(v.papel as Papel);
        porUsuario.set(v.usuario_id, lista);
      }
      return (perfis.data ?? []).map((p) => ({ ...p, papeis: porUsuario.get(p.id) ?? [] }));
    },
  });

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Equipe"
        descricao="Pessoas com acesso ao sistema nesta empresa e seus papéis."
        acoes={<BotaoAdicionar modulo="Equipe" proximaEtapa="liberar o convite de usuários e atribuição de papéis." />}
      />

      <div className="rounded-lg border bg-card">
        {consulta.isLoading ? (
          <div className="p-4">
            <CarregandoTabela colunas={4} />
          </div>
        ) : consulta.isError ? (
          <div className="p-4">
            <EstadoErro
              descricao={(consulta.error as Error).message}
              aoTentarNovamente={() => void consulta.refetch()}
            />
          </div>
        ) : (consulta.data?.length ?? 0) === 0 ? (
          <div className="p-4">
            <EstadoVazio
              icone={<Users className="size-5" aria-hidden="true" />}
              titulo="Nenhum usuário visível"
              descricao="Seu papel de acesso pode limitar a lista. Novos usuários aparecem aqui após o primeiro acesso."
              className="border-0"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.map((pessoa) => (
                  <TableRow key={pessoa.id}>
                    <TableCell className="font-medium">{pessoa.nome}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {pessoa.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {pessoa.cargo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {pessoa.papeis.length === 0 ? (
                          <SeloStatus rotulo="Sem papel" tom="alerta" />
                        ) : (
                          pessoa.papeis.map((papel) => (
                            <SeloStatus key={papel} rotulo={ROTULO_PAPEL[papel]} tom="info" />
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SeloAtivo ativo={pessoa.ativo} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
