import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/app-layout";
import { CarregandoCartoes, EstadoErro } from "@/components/comum/estados";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/entrar" });

    // Verificação de permissão de módulo
    const path = location.pathname.split('/')[1] || 'dashboard';
    const modulosMapeados: Record<string, string> = {
      '': 'dashboard',
      'vendas': 'vendas',
      'producao': 'producao',
      'estoque': 'estoque',
      'entregas': 'entregas',
      'financeiro': 'financeiro',
      'clientes': 'clientes',
      'fornecedores': 'fornecedores',
      'equipe': 'equipe',
      'relatorios': 'relatorios',
      'configuracoes': 'configuracoes',
    };

    const moduloAlvo = modulosMapeados[path];
    
    // Como beforeLoad roda antes do hook useSessao estar disponível no contexto da rota filha,
    // precisamos buscar as permissões diretamente via Supabase para o gate de segurança.
    if (moduloAlvo) {
      const { data: papeis } = await supabase
        .from("usuarios_papeis")
        .select("papel")
        .eq("usuario_id", data.user.id);
      
      const isAdmin = papeis?.some(p => p.papel === 'administrador');
      
      if (!isAdmin) {
        const { data: perm } = await supabase
          .from("permissoes_acesso")
          .select("pode_visualizar")
          .eq("usuario_id", data.user.id)
          .eq("modulo", moduloAlvo)
          .maybeSingle();

        if (perm && !perm.pode_visualizar) {
          // Nota: toast não funciona em beforeLoad pq não há render, mas o redirect funciona.
          // O aviso será dado na página inicial ou via flash message se implementado.
          throw redirect({ 
            to: "/",
            search: { 
              error: 'Acesso não autorizado' 
            }
          });
        }
      }
    }

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

