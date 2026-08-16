import { Link, useLocation, useRouter } from "@tanstack/react-router";
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
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Gestão BMs</p>
            <p className="truncate text-xs text-sidebar-foreground/60">Controle operacional</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {GRUPOS_MENU.map((grupo) => (
          <SidebarGroup key={grupo.rotulo}>
            <SidebarGroupLabel>{grupo.rotulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.itens.map((item) => {
                  const ativo = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={ativo} tooltip={item.titulo}>
                        <Link to={item.url} aria-current={ativo ? "page" : undefined}>
                          <item.icone aria-hidden="true" />
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
            <SidebarMenuButton className="h-12 w-full justify-start gap-3 px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {iniciais(nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-sidebar-foreground">{nome}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">{perfil?.email}</span>
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
        <p className="mt-2 px-2 py-1 text-[11px] leading-tight text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          Valores em real (BRL). Datas no formato dd/MM/aaaa.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

function BarraSuperior() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
      <div className="flex flex-1 items-center gap-2 min-w-0">
      </div>
    </header>
  );
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
