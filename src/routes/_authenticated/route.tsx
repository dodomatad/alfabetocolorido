import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect } from "react";

import { AppLayout } from "@/components/layout/app-layout";
import { CarregandoCartoes, EstadoErro } from "@/components/comum/estados";
import { useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";
import { registrarLogAcesso } from "@/lib/logs.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/entrar" });
    }

    // A lógica de verificação de perfil/empresa agora é feita dentro do componente LayoutProtegido
    // para evitar redirecionamentos falsos durante o carregamento da sessão no hook useSessao.
    // beforeLoad aqui serve apenas como um gate primário de autenticação.
    
    return { user: data.user };
  },
  component: LayoutProtegido,
});

function LayoutProtegido() {
  const { session, perfil, carregando, erro, recarregar, temPermissao } = useSessao();
  const router = useRouter();
  const { pathname } = router.state.location;

  useEffect(() => {
    // Gate de Acesso em Análise: só redireciona se terminou de carregar e NÃO tem empresa
    if (!carregando && session?.user && !perfil?.empresa_id && pathname !== "/aguardando-aprovacao") {
      router.navigate({ to: "/aguardando-aprovacao" });
    }

    // Gate de Permissões de Módulo
    if (!carregando && session?.user && perfil?.empresa_id && pathname !== "/aguardando-aprovacao") {
      const path = pathname.split('/')[1] || 'dashboard';
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
      if (moduloAlvo && !temPermissao(moduloAlvo, 'visualizar')) {
        toast.error("Você não tem permissão para acessar este módulo");
        router.navigate({ to: "/" });
      }
    }
  }, [carregando, session, perfil, pathname, router, temPermissao]);

  useEffect(() => {
    // Registra log apenas quando a sessão é carregada pela primeira vez neste layout
    if (session?.user && !carregando && !erro && perfil?.empresa_id) {
      const chave = `log-acesso-registrado-${session.user.id}-${new Date().toISOString().split('T')[0]}`;
      const jaRegistrouHoje = sessionStorage.getItem(chave);
      
      if (!jaRegistrouHoje) {
        const registrar = async () => {
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
                usuarioId: session.user.id,
                usuarioNome: perfil?.nome || session.user.email?.split("@")[0] || "Usuário",
                dispositivo,
                ip,
              },
            });
            sessionStorage.setItem(chave, "true");
          } catch (e) {
            console.error("Erro ao registrar log de acesso automático:", e);
          }
        };
        void registrar();
      }
    }
  }, [session, perfil, carregando, erro]);

  if (carregando) {
    return <CarregandoCartoes />;
  }

  if (erro) {
    return <EstadoErro descricao={erro.message} aoTentarNovamente={recarregar} />;
  }

  // Se não tem empresa e não está na página de aguardando, o useEffect vai navegar.
  // Enquanto isso, retornamos um loading para evitar flash do dashboard.
  if (!perfil?.empresa_id && pathname !== "/aguardando-aprovacao") {
    return <CarregandoCartoes />;
  }

  // Se estiver na página de aguardando aprovação, não renderizamos o AppLayout (sidebar)
  if (pathname === "/aguardando-aprovacao") {
    return <Outlet />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
