import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppLayout } from "@/components/layout/app-layout";
import { CarregandoCartoes, EstadoErro } from "@/components/comum/estados";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/entrar" });
    return { user: data.user };
  },
  component: LayoutProtegido,
});

function LayoutProtegido() {
  const { carregando, erro, recarregar } = useSessao();

  return (
    <AppLayout>
      {carregando ? (
        <CarregandoCartoes />
      ) : erro ? (
        <EstadoErro descricao={erro.message} aoTentarNovamente={recarregar} />
      ) : (
        <Outlet />
      )}
    </AppLayout>
  );
}

