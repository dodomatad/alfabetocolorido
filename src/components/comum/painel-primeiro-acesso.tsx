import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { apenasDigitos, documentoValido } from "@/lib/formatadores";

export function PainelPrimeiroAcesso() {
  const queryClient = useQueryClient();
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const criar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("criar_empresa_inicial", {
        _razao_social: razaoSocial.trim(),
        _nome_fantasia: nomeFantasia.trim() || undefined,
        _cnpj: cnpj.trim() ? apenasDigitos(cnpj) : undefined,
        _nome_usuario: nomeUsuario.trim() || undefined,

      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast.success("Empresa criada", {
        description: "Você foi definido como administrador do sistema.",
      });
      await queryClient.invalidateQueries({ queryKey: ["sessao"] });
    },
    onError: (error: Error) => {
      toast.error("Não foi possível criar a empresa", { description: error.message });
    },
  });

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const novosErros: Record<string, string> = {};
    if (razaoSocial.trim().length < 3) novosErros["razaoSocial"] = "Informe a razão social completa.";
    if (nomeUsuario.trim().length < 2) novosErros["nomeUsuario"] = "Informe seu nome.";
    if (cnpj.trim() && !documentoValido(cnpj)) novosErros["cnpj"] = "CNPJ inválido.";
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;
    criar.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="shadow-panel">
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <CardTitle>Configuração inicial da empresa</CardTitle>
          <CardDescription>
            Antes de usar o sistema, cadastre a empresa que será dona dos dados. Todos os registros ficam
            isolados por empresa e você será registrado como administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={enviar} noValidate>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="razao-social">Razão social</Label>
              <Input
                id="razao-social"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Ex.: Indústria de BMs Ltda"
                aria-invalid={Boolean(erros["razaoSocial"])}
              />
              {erros["razaoSocial"] ? (
                <p className="text-xs text-destructive">{erros["razaoSocial"]}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nome-fantasia">Nome fantasia</Label>
              <Input
                id="nome-fantasia"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="Opcional"
                inputMode="numeric"
                aria-invalid={Boolean(erros["cnpj"])}
              />
              {erros["cnpj"] ? <p className="text-xs text-destructive">{erros["cnpj"]}</p> : null}
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="nome-usuario">Seu nome</Label>
              <Input
                id="nome-usuario"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Como você aparece para a equipe"
                aria-invalid={Boolean(erros["nomeUsuario"])}
              />
              {erros["nomeUsuario"] ? (
                <p className="text-xs text-destructive">{erros["nomeUsuario"]}</p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={criar.isPending}>
                {criar.isPending ? "Criando empresa…" : "Criar empresa e continuar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
