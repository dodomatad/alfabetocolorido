import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-bm.png.asset.json";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validarConvite, aceitarConvite } from "@/lib/convites.functions";

export const Route = createFileRoute("/aceitar-convite")({
  validateSearch: (search) => z.object({ token: z.string().optional() }).parse(search),
  head: () => ({
    meta: [{ title: "Aceitar Convite | Gestão BMs" }],
  }),
  component: PaginaAceitarConvite,
});

function PaginaAceitarConvite() {
  const router = useRouter();
  const { token } = Route.useSearch();
  const [convite, setConvite] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fnValidar = useServerFn(validarConvite);
  const fnAceitar = useServerFn(aceitarConvite);

  useEffect(() => {
    if (!token) {
      setErro("Token de convite não fornecido.");
      setCarregando(false);
      return;
    }

    fnValidar({ data: { token } })
      .then((dados) => {
        setConvite(dados);
        if (dados.email) setEmail(dados.email);
        setCarregando(false);
      })
      .catch((err) => {
        setErro(err.message || "Convite inválido ou expirado.");
        setCarregando(false);
      });
  }, [token, fnValidar]);

  async function handleAceitar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setEnviando(true);
    try {
      await fnAceitar({
        data: {
          token,
          nome,
          email,
          password: senha,
        },
      });
      toast.success("Conta criada e vinculada com sucesso!");
      router.navigate({ to: "/" });
    } catch (err: any) {
      toast.error("Erro ao aceitar convite", { description: err.message });
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (erro || !convite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-destructive/20 shadow-panel">
          <CardHeader>
            <CardTitle className="text-destructive">Convite Inválido</CardTitle>
            <CardDescription>{erro || "Este link de convite não é mais válido."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.navigate({ to: "/entrar" })}>
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <img 
            src={logoAsset.url} 
            onError={(e) => { e.currentTarget.src = "/logo-bm.png"; }}
            alt="Logo BM" 
            className="size-11 rounded-lg object-cover shadow-panel" 
          />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Gestão BMs</h1>
            <p className="text-sm text-muted-foreground">Convite de Equipe</p>
          </div>
        </div>

        <Card className="shadow-panel border-primary/20 bg-[#141417]">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldCheck className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Você foi convidado!</span>
            </div>
            <CardTitle className="text-xl">Junte-se a {convite.empresas?.nome_fantasia || convite.empresas?.razao_social}</CardTitle>
            <CardDescription>Complete seu cadastro para acessar a plataforma como {convite.cargo}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAceitar} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nome"
                    required
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!convite.email}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="senha">Criar Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={enviando} className="mt-2 w-full font-bold">
                {enviando ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Aceitar Convite e Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
