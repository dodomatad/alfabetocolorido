import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/aguardando-aprovacao")({
  head: () => ({
    meta: [{ title: "Aguardando Aprovação | Gestão BMs" }],
  }),
  component: PaginaAguardandoAprovacao,
});

function PaginaAguardandoAprovacao() {
  const router = useRouter();

  const sair = async () => {
    await supabase.auth.signOut();
    void router.navigate({ to: "/entrar" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-amber-500/20 shadow-panel">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <ShieldAlert className="size-6" />
          </div>
          <CardTitle className="text-xl">Acesso em Análise</CardTitle>
          <CardDescription>
            Sua conta ainda não está vinculada a nenhuma empresa no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Para acessar o painel, você precisa ser convidado por um administrador ou ter seu acesso aprovado pela equipe de gestão.
          </p>
          <div className="pt-4">
            <Button variant="outline" className="w-full gap-2" onClick={sair}>
              <LogOut className="size-4" />
              Sair e entrar com outra conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
