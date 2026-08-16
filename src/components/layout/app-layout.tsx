import { Link, useLocation, useRouter } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-bm.png.asset.json";
import { Building2, LogOut, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { GRUPOS_MENU } from "@/components/layout/menu-navegacao";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ROTULO_PAPEL, useSessao } from "@/hooks/use-sessao";
import { supabase } from "@/integrations/supabase/client";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "U";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

function NavegacaoLateral() {
  const { pathname } = useLocation();
  const { perfil, papeis } = useSessao();
  const router = useRouter();

  const nome = perfil?.nome ?? "Usuário";
  const papelPrincipal = papeis[0] ? ROTULO_PAPEL[papeis[0]] : "Sem papel definido";

  async function sair() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Não foi possível sair", { description: error.message });
      return;
    }
    toast.success("Sessão encerrada");
    await router.navigate({ to: "/entrar" });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <img 
            src={logoAsset.url} 
            alt="Logo BM" 
            className="size-8 shrink-0 rounded-md object-cover shadow-sm" 
          />

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-blue-500">Gestão BMs</p>
            <p className="truncate text-xs text-blue-400/70">Controle operacional</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {GRUPOS_MENU.map((grupo) => (
          <SidebarGroup key={grupo.rotulo}>
            <SidebarGroupLabel className="text-blue-400/80 font-medium uppercase tracking-wider text-[10px]">{grupo.rotulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) => {
                  const ativo = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={ativo} 
                        tooltip={item.titulo}
                        className={`
                          transition-all duration-200
                          ${ativo 
                            ? "bg-blue-950/40 text-blue-400 font-bold border-l-2 border-blue-500 rounded-r-md rounded-l-none" 
                            : "text-blue-500/90 hover:text-blue-300 hover:bg-blue-950/20"
                          }
                        `}
                      >
                        <Link to={item.url} aria-current={ativo ? "page" : undefined}>
                          <item.icone className={ativo ? "text-blue-400" : "text-blue-500"} aria-hidden="true" />
                          <span>{item.titulo}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="h-12 w-full justify-start gap-3 px-2 hover:bg-blue-950/20 transition-colors">
              <Avatar className="size-8 border border-blue-500/20">
                <AvatarFallback className="bg-blue-600 text-xs text-white">
                  {iniciais(nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-blue-400">{nome}</span>
                <span className="truncate text-xs text-blue-400/60">{perfil?.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60" side="right" sideOffset={12}>
            <DropdownMenuLabel>
              <p className="truncate text-sm font-medium">{nome}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{perfil?.email ?? "—"}</p>
              <p className="mt-1 text-xs font-normal text-muted-foreground">Papel: {papelPrincipal}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil">
                <UserRound className="size-4" aria-hidden="true" />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void sair()}>
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function BarraSuperior() {
  return null;
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <NavegacaoLateral />
      <SidebarInset className="min-w-0">
        <BarraSuperior />
        <main className="mx-auto w-full max-w-[100rem] flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
