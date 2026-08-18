import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Papel = Database["public"]["Enums"]["app_role"];
type Modulo = Database["public"]["Enums"]["modulo_sistema"];

export const validarConvite = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: convite, error } = await supabase
      .from("convites_equipe")
      .select("*, empresas(nome_fantasia, razao_social)")
      .eq("token", data.token)
      .eq("status", "pendente")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    if (!convite) throw new Error("Convite inválido ou expirado");

    return convite;
  });

export const aceitarConvite = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ 
    token: z.string(),
    nome: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6)
  }).parse(data))
  .handler(async ({ data }) => {
    // 1. Validar convite
    const { data: convite, error: errConvite } = await supabase
      .from("convites_equipe")
      .select("*")
      .eq("token", data.token)
      .eq("status", "pendente")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (errConvite || !convite) throw new Error("Convite inválido ou expirado");

    // 2. Criar usuário no Supabase Auth
    const { data: authUser, error: errAuth } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.nome,
          convite_token: data.token
        }
      }
    });

    if (errAuth) throw errAuth;
    if (!authUser.user) throw new Error("Erro ao criar usuário");

    // 3. Processamento via admin
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    try {
        const empresaId = convite.empresa_id;
        if (!empresaId) throw new Error("Empresa não definida no convite");

        // Criar perfil
        const { error: errPerfil } = await supabaseAdmin
            .from("perfis")
            .insert({
                id: authUser.user.id,
                empresa_id: empresaId,
                nome: data.nome,
                email: data.email,
                cargo: convite.cargo,
                ativo: true
            });
        if (errPerfil) throw errPerfil;

        // Atribuir papel
        const { error: errPapel } = await supabaseAdmin
            .from("usuarios_papeis")
            .insert({
                usuario_id: authUser.user.id,
                papel: convite.papel as Papel
            });
        if (errPapel) throw errPapel;

        // Atribuir permissões
        const permissoesObj = convite.permissoes as any;
        const insercoesPerms = Object.entries(permissoesObj).map(([modulo, perms]: [string, any]) => ({
            usuario_id: authUser.user.id,
            empresa_id: empresaId,
            modulo: modulo as Modulo,
            pode_visualizar: perms.pode_visualizar ?? false,
            pode_criar: perms.pode_criar ?? false,
            pode_editar: perms.pode_editar ?? false,
            pode_excluir: perms.pode_excluir ?? false,
            ocultar_valores: perms.ocultar_valores ?? false
        }));

        if (insercoesPerms.length > 0) {
            const { error: errPerms } = await supabaseAdmin
                .from("permissoes_acesso")
                .insert(insercoesPerms as any);
            if (errPerms) throw errPerms;
        }

        // Marcar convite como aceito
        const { error: errUpdateConvite } = await supabaseAdmin
            .from("convites_equipe")
            .update({
                status: 'aceito',
                usado_por: authUser.user.id
            })
            .eq("id", convite.id);
        if (errUpdateConvite) throw errUpdateConvite;

        return { success: true, userId: authUser.user.id };
    } catch (err) {
        throw err;
    }
  });
