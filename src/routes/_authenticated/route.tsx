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
      const { data: permissaoValida } = await supabase.rpc('check_permission', {
        _user_id: data.user.id,
        _modulo: moduloAlvo as any,
        _acao: 'visualizar'
      });

      if (permissaoValida === false) {
        throw redirect({ 
          to: "/",
          search: { 
            error: 'Acesso não autorizado' 
          }
        });
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

