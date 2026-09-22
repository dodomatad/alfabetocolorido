import { createFileRoute, useNavigate } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-bm.png.asset.json";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir Senha | Gestão BMs" },
      { property: "og:title", content: "Redefinir Senha | Gestão BMs" },
    ],
  }),
  component: PaginaRedefinirSenha,
});

function PaginaRedefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [erroSessao, setErroSessao] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário chegou aqui via link de recuperação (possui hash com token ou sessão ativa)
    const verificarSessao = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error);
          setErroSessao("Link inválido ou expirado.");
        } else if (!data.session) {
          // Em alguns casos, o Supabase coloca as infos no hash. 
          // O onAuthStateChange cuida de injetar a sessão se o token for válido.
          // Se não injetou, o link pode ser inválido.
          setErroSessao("Sessão não identificada. Tente solicitar um novo link.");
        }
      } catch (err) {
        setErroSessao("Erro técnico ao validar acesso.");
      } finally {
        setCarregandoSessao(false);
      }
    };

    void verificarSessao();
  }, []);

  async function atualizarSenha(evento: React.FormEvent) {
    evento.preventDefault();
    
    if (senha.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error("As senhas informadas não coincidem.");
      return;
    }

    setEnviando(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        toast.error("Erro ao atualizar senha", { description: error.message });
        return;
      }

      setSucesso(true);
      toast.success("Senha alterada com sucesso!");
      
      // Logout automático para forçar novo login com a nova senha (segurança)
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      toast.error("Erro de conexão ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Validando acesso...</span>
        </div>
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
            <p className="text-sm text-muted-foreground">Segurança da conta</p>
          </div>
        </div>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>Criar nova senha</CardTitle>
            <CardDescription>
              {sucesso 
                ? "Sua senha foi atualizada com segurança." 
                : "Defina uma senha forte que você não utilize em outros sites."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sucesso ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">Sua senha foi alterada com sucesso!</p>
                  <p className="text-muted-foreground">Agora você já pode acessar o sistema com suas novas credenciais.</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => navigate({ to: "/entrar" })}
                >
                  Fazer login agora
                </Button>
              </div>
            ) : erroSessao ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{erroSessao}</p>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate({ to: "/recuperar-senha" })}
                >
                  Solicitar novo link
                </Button>
              </div>
            ) : (
              <form className="grid gap-4" onSubmit={atualizarSenha}>
                <div className="grid gap-2">
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Mínimo de 8 caracteres"
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Atualizando..." : "Definir nova senha"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}