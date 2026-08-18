import { createFileRoute, useRouter } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-bm.png.asset.json";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registrarLogAcesso } from "@/lib/logs.functions";
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
  const [abaAtiva, setAbaAtiva] = useState("entrar");

  useEffect(() => {
    const emailSalvo = localStorage.getItem(CHAVE_EMAIL_LEMBRADO);
    const senhaSalva = localStorage.getItem(CHAVE_SENHA_LEMBRADA);

    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrar(true);
    }
    if (senhaSalva) {
      setSenha(senhaSalva);
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void router.navigate({ to: "/" });
    });
  }, [router]);

  async function registrarLog(user: any) {
    try {
      const userAgent = navigator.userAgent;
      let dispositivo = "Navegador Web";
      if (/iPhone/i.test(userAgent)) dispositivo = "Safari / iPhone";
      else if (/Android/i.test(userAgent)) dispositivo = "Chrome / Android";
      else if (/Windows/i.test(userAgent)) dispositivo = "Chrome / Windows";
      else if (/Macintosh/i.test(userAgent)) dispositivo = "Safari / macOS";

      let ip = "127.0.0.1";
      try {
        const resp = await fetch("https://api.ipify.org?format=json");
        const data = await resp.json();
        ip = data.ip;
      } catch (e) {
        console.warn("Não foi possível obter o IP do cliente", e);
      }

      await registrarLogAcesso({
        data: {
          usuarioId: user.id,
          usuarioNome: user.user_metadata?.nome || user.email?.split("@")[0] || "Usuário",
          dispositivo,
          ip,
        },
      });
    } catch (e) {
      console.error("Erro ao registrar log de login:", e);
    }
  }

  async function registrarTentativaFalha(emailAlvo: string) {
    try {
      const { registrarFalhaLogin } = await import("@/lib/equipe.functions");
      const userAgent = navigator.userAgent;
      let dispositivo = "Navegador Web";
      if (/iPhone/i.test(userAgent)) dispositivo = "Safari / iPhone";
      else if (/Android/i.test(userAgent)) dispositivo = "Chrome / Android";
      else if (/Windows/i.test(userAgent)) dispositivo = "Chrome / Windows";
      else if (/Macintosh/i.test(userAgent)) dispositivo = "Safari / macOS";

      let ip = "127.0.0.1";
      try {
        const resp = await fetch("https://api.ipify.org?format=json");
        const data = await resp.json();
        ip = data.ip;
      } catch (e) {}

      await registrarFalhaLogin({
        data: {
          email: emailAlvo,
          dispositivo,
          ip,
        },
      });
    } catch (e) {
      console.error("Erro ao registrar falha de login:", e);
    }
  }

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!emailValido(email)) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setEnviando(true);
    const emailSanitizado = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailSanitizado,
        password: senha,
      });

      if (error) {
        setEnviando(false);
        if (error.message === "Invalid login credentials") {
          void registrarTentativaFalha(emailSanitizado);
          toast.error("Não foi possível entrar", {
            description: "E-mail ou senha incorretos.",
          });
        } else {
          toast.error("Não foi possível entrar", {
            description: error.message,
          });
        }
        return;
      }

      if (lembrar) {
        localStorage.setItem(CHAVE_EMAIL_LEMBRADO, emailSanitizado);
        localStorage.setItem(CHAVE_SENHA_LEMBRADA, senha);
      } else {
        localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
        localStorage.removeItem(CHAVE_SENHA_LEMBRADA);
      }

      if (data.user) {
        // Registro de log não bloqueante
        void registrarLog(data.user);
      }

    toast.success("Login realizado com sucesso!");
    await router.navigate({ to: "/" });
    } catch (err: any) {
      console.error("Erro no login:", err);
      toast.error("Erro de conexão ao servidor (Failed to fetch). Verifique a internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function criarConta(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe seu nome completo");
      return;
    }
    if (!emailValido(email)) {
      toast.error("Informe um e-mail válido");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    setEnviando(true);
    const emailSanitizado = email.trim().toLowerCase();
    
    // 1. Criar usuário no Auth
    const { data, error } = await supabase.auth.signUp({
      email: emailSanitizado,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: nome.trim() },
      },
    });

    if (error) {
      setEnviando(false);
      if (error.message.toLowerCase().includes("already registered")) {
        toast.info("Este e-mail já possui cadastro. Redirecionando para a tela de login...");
        setAbaAtiva("entrar");
        return;
      }
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }

    if (data.user) {
      // 2. Executar Onboarding (Cria empresa, perfil e papel padrão)
      // O RPC agora retorna um JSONB com o status da operação
      const { data: onboardingRes, error: errorOnboarding } = await supabase.rpc('onboarding_novo_usuario', {
        _nome_usuario: nome.trim()
      });

      if (errorOnboarding || (onboardingRes as any)?.success === false) {
        console.error("Erro no onboarding:", errorOnboarding || (onboardingRes as any)?.error);
        toast.error("Erro ao configurar sua empresa", { 
          description: "Sua conta foi criada, mas houve um problema na configuração inicial. Tente atualizar a página." 
        });
      }

      void registrarLog(data.user);
      
      if (!errorOnboarding && (onboardingRes as any)?.success !== false) {
        toast.success("Conta criada com sucesso!", {
          description: "Bem-vindo ao Gestão BMs. Sua empresa foi configurada.",
        });
      }
      
      setEnviando(false);
      // Forçar recarregamento para garantir que a sessão e empresa_id sejam injetados corretamente
      window.location.href = "/";
    } else {
      setEnviando(false);
    }
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
          <img 
            src={logoAsset.url} 
            alt="Logo BM" 
            className="size-11 rounded-lg object-cover shadow-panel" 
          />

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
            <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
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
                    <div className="flex justify-end">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-muted-foreground"
                        type="button"
                        onClick={() => toast.info("Funcionalidade de recuperação de senha em desenvolvimento.")}
                      >
                        Esqueceu sua senha?
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="lembrar-acesso"
                      checked={lembrar}
                      onCheckedChange={(valor) => setLembrar(valor === true)}
                    />
                    <Label htmlFor="lembrar-acesso" className="text-sm font-normal">
                      Lembrar de mim
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
