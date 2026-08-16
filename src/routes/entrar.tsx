import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { emailValido } from "@/lib/formatadores";

const CHAVE_EMAIL_LEMBRADO = "gestao-bms:email-lembrado";
const CHAVE_SENHA_LEMBRADA = "gestao-bms:senha-lembrada";


export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar | Gestão BMs" },
      {
        name: "description",
        content:
          "Acesso ao Gestão BMs, sistema interno de vendas, produção, estoque e financeiro de BMs.",
      },
      { property: "og:title", content: "Entrar | Gestão BMs" },
      {
        property: "og:description",
        content: "Acesso restrito ao sistema interno de gestão de vendas, produção e financeiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaEntrar,
});

function PaginaEntrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [lembrar, setLembrar] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_EMAIL_LEMBRADO);
    if (salvo) {
      setEmail(salvo);
      setLembrar(true);
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void router.navigate({ to: "/" });
    });
  }, [router]);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!emailValido(email)) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível entrar", {
        description:
          error.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos."
            : error.message,
      });
      return;
    }
    if (lembrar) localStorage.setItem(CHAVE_EMAIL_LEMBRADO, email.trim());
    else localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
    toast.success("Bem-vindo de volta");
    await router.navigate({ to: "/" });
  }

  async function criarConta(evento: React.FormEvent) {
    evento.preventDefault();
    if (!emailValido(email)) {
      toast.error("Informe um e-mail válido");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: nome.trim() },
      },
    });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    toast.success("Conta criada", {
      description: "Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.",
    });
    await router.navigate({ to: "/" });
  }

  async function entrarComGoogle() {
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      toast.error("Não foi possível entrar com Google", { description: resultado.error.message });
      return;
    }
    if (resultado.redirected) return;
    await router.navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Gestão BMs</h1>
            <p className="text-sm text-muted-foreground">
              Vendas, produção, estoque e financeiro em um só lugar
            </p>
          </div>
        </div>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>Acesso ao sistema</CardTitle>
            <CardDescription>Use as credenciais fornecidas pela sua empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar" className="mt-4">
                <form className="grid gap-4" onSubmit={entrar} noValidate>
                  <div className="grid gap-2">
                    <Label htmlFor="email-entrar">E-mail</Label>
                    <Input
                      id="email-entrar"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com.br"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="senha-entrar">Senha</Label>
                    <Input
                      id="senha-entrar"
                      type="password"
                      autoComplete="current-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="lembrar-acesso"
                      checked={lembrar}
                      onCheckedChange={(valor) => setLembrar(valor === true)}
                    />
                    <Label htmlFor="lembrar-acesso" className="text-sm font-normal">
                      Lembrar meu acesso
                    </Label>
                  </div>
                  <Button type="submit" disabled={enviando}>
                    {enviando ? "Entrando…" : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="criar" className="mt-4">
                <form className="grid gap-4" onSubmit={criarConta} noValidate>
                  <div className="grid gap-2">
                    <Label htmlFor="nome-criar">Nome completo</Label>
                    <Input
                      id="nome-criar"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email-criar">E-mail</Label>
                    <Input
                      id="email-criar"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="senha-criar">Senha</Label>
                    <Input
                      id="senha-criar"
                      type="password"
                      autoComplete="new-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
                  </div>
                  <Button type="submit" disabled={enviando}>
                    {enviando ? "Criando conta…" : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full" onClick={() => void entrarComGoogle()}>
              Continuar com Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
