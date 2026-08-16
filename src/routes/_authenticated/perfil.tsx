import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { SeloStatus } from "@/components/comum/selo-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROTULO_PAPEL, useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil | Gestão BMs" },
      {
        name: "description",
        content: "Consulte e atualize seus dados de contato, cargo e papéis de acesso no Gestão BMs.",
      },
      { property: "og:title", content: "Meu perfil | Gestão BMs" },
      { property: "og:description", content: "Dados de contato, cargo e papéis de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaPerfil,
});

function PaginaPerfil() {
  const { perfil, papeis, empresa } = useSessao();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");

  useEffect(() => {
    setNome(perfil?.nome ?? "");
    setTelefone(perfil?.telefone ?? "");
    setCargo(perfil?.cargo ?? "");
  }, [perfil]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado");
      const { error } = await supabase
        .from("perfis")
        .update({
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          cargo: cargo.trim() || null,
        })
        .eq("id", perfil.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado");
      await queryClient.invalidateQueries({ queryKey: ["sessao"] });
    },
    onError: (error: Error) =>
      toast.error("Não foi possível salvar", { description: error.message }),
  });

  return (
    <div className="space-y-6">
      <CabecalhoPagina titulo="Meu perfil" descricao="Seus dados de contato e permissões nesta empresa." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>O e-mail de acesso é gerenciado pela autenticação e não pode ser alterado aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (nome.trim().length < 2) {
                  toast.error("Informe seu nome completo");
                  return;
                }
                salvar.mutate();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="perfil-nome">Nome</Label>
                <Input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="perfil-email">E-mail</Label>
                <Input id="perfil-email" value={perfil?.email ?? ""} disabled readOnly />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="perfil-telefone">Telefone</Label>
                  <Input
                    id="perfil-telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    inputMode="tel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="perfil-cargo">Cargo</Label>
                  <Input id="perfil-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
                </div>
              </div>
              <div>
                <Button type="submit" disabled={salvar.isPending}>
                  {salvar.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acesso</CardTitle>
            <CardDescription>Definido pelo administrador da empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Empresa</p>
              <p className="font-medium">
                {empresa?.nome_fantasia || empresa?.razao_social || "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-muted-foreground">Papéis</p>
              <div className="flex flex-wrap gap-2">
                {papeis.length === 0 ? (
                  <SeloStatus rotulo="Sem papel definido" tom="alerta" />
                ) : (
                  papeis.map((papel) => (
                    <SeloStatus key={papel} rotulo={ROTULO_PAPEL[papel]} tom="info" />
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
