import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Papel =
  | "administrador"
  | "gestor"
  | "financeiro"
  | "supervisor_producao"
  | "funcionario"
  | "visualizacao";

export const ROTULO_PAPEL: Record<Papel, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  financeiro: "Financeiro",
  supervisor_producao: "Supervisor de produção",
  funcionario: "Funcionário",
  visualizacao: "Visualização",
};

export type Empresa = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  logo_url: string | null;
  fuso_horario: string;
};

export type Perfil = {
  id: string;
  empresa_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  ativo: boolean;
};

export type ContextoSessao = {
  session: Session | null;
  perfil: Perfil | null;
  empresa: Empresa | null;
  papeis: Papel[];
  carregando: boolean;
  erro: Error | null;
  recarregar: () => void;
  temPapel: (...papeis: Papel[]) => boolean;
  podeGerenciar: boolean;
  fuso: string;
};

const Contexto = createContext<ContextoSessao | null>(null);

async function carregarSessao() {
  const { data: sessaoAtual } = await supabase.auth.getSession();
  const session = sessaoAtual.session ?? null;
  if (!session) return { session: null, perfil: null, empresa: null, papeis: [] as Papel[] };

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("id, empresa_id, nome, email, telefone, cargo, ativo")
    .eq("id", session.user.id)
    .maybeSingle();
  if (erroPerfil) throw erroPerfil;

  const { data: vinculos, error: erroPapeis } = await supabase
    .from("usuarios_papeis")
    .select("papel")
    .eq("usuario_id", session.user.id);
  if (erroPapeis) throw erroPapeis;

  let empresa: Empresa | null = null;
  if (perfil?.empresa_id) {
    const { data, error } = await supabase
      .from("empresas")
      .select("id, razao_social, nome_fantasia, cnpj, telefone, email, endereco, logo_url, fuso_horario")
      .eq("id", perfil.empresa_id)
      .maybeSingle();
    if (error) throw error;
    empresa = data as Empresa | null;
  }

  return {
    session,
    perfil: (perfil as Perfil | null) ?? null,
    empresa,
    papeis: (vinculos ?? []).map((v) => v.papel as Papel),
  };
}

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: ["sessao"],
    queryFn: carregarSessao,
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_IN" || evento === "SIGNED_OUT" || evento === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["sessao"] });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const valor = useMemo<ContextoSessao>(() => {
    const papeis = consulta.data?.papeis ?? [];
    return {
      session: consulta.data?.session ?? null,
      perfil: consulta.data?.perfil ?? null,
      empresa: consulta.data?.empresa ?? null,
      papeis,
      carregando: consulta.isLoading,
      erro: (consulta.error as Error | null) ?? null,
      recarregar: () => void consulta.refetch(),
      temPapel: (...alvos: Papel[]) => alvos.some((p) => papeis.includes(p)),
      podeGerenciar: papeis.includes("administrador") || papeis.includes("gestor"),
      fuso: consulta.data?.empresa?.fuso_horario ?? "America/Sao_Paulo",
    };
  }, [consulta]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useSessao precisa estar dentro de ProvedorSessao");
  return ctx;
}
