import { createFileRoute, useNavigate } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-bm.png.asset.json";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { emailValido } from "@/lib/formatadores";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar Senha | Gestão BMs" },
      { property: "og:title", content: "Recuperar Senha | Gestão BMs" },
    ],
  }),
  component: PaginaRecuperarSenha,
});

function PaginaRecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function enviarEmail(evento: React.FormEvent) {
    evento.preventDefault();
    if (!emailValido(email)) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setEnviando(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        toast.error("Erro ao enviar e-mail", { description: error.message });
        return;
      }

      setSucesso(true);
      toast.success("E-mail enviado!");
    } catch (err: any) {
      console.error("Erro ao recuperar senha:", err);
      toast.error("Erro de conexão ao servidor.");
    } finally {
      setEnviando(false);
    }
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
            <p className="text-sm text-muted-foreground">Recuperação de acesso</p>
          </div>
        </div>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>
              {sucesso 
                ? "Verifique sua caixa de entrada para continuar." 
                : "Informe seu e-mail para receber as instruções de recuperação."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sucesso ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2 text-sm">
                  <p>Enviamos um link de recuperação para o e-mail informado.</p>
                  <p className="text-muted-foreground italic">Se o e-mail estiver cadastrado, você o receberá em instantes.</p>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate({ to: "/entrar" })}
                >
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={enviarEmail}>
                <div className="grid gap-2">
                  <Label htmlFor="email-recuperar">E-mail cadastrado</Label>
                  <Input
                    id="email-recuperar"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Enviando e-mail..." : "Enviar link de recuperação"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full gap-2"
                  onClick={() => navigate({ to: "/entrar" })}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}