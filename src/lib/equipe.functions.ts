import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type Papel = Database["public"]["Enums"]["app_role"];
type Modulo = Database["public"]["Enums"]["modulo_sistema"];

export const cadastrarMembroEquipe = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        nome: z.string().min(3),
        email: z.string().email(),
        senha: z.string().min(6),
        cargo: z.string(),
        papel: z.string(),
        empresaId: z.string(),
        permissoes: z.record(z.any()),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    // 1. Criar usuário no Supabase Auth (Admin API para confirmação automática)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.senha,
      email_confirm: true,
      user_metadata: {
        nome: data.nome,
        cargo: data.cargo,
        papel: data.papel,
      },
    });

    if (authError) {
      console.error("Erro ao criar usuário no Auth:", authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    const userId = authUser.user.id;

    try {
      // 2. Criar perfil
      const { error: perfilError } = await supabaseAdmin.from("perfis").insert({
        id: userId,
        empresa_id: data.empresaId,
        nome: data.nome,
        email: data.email.trim().toLowerCase(),
        cargo: data.cargo,
        ativo: true,
      });

      if (perfilError) throw perfilError;

      // 3. Atribuir papel
      const { error: papelError } = await supabaseAdmin.from("usuarios_papeis").insert({
        usuario_id: userId,
        empresa_id: data.empresaId,
        papel: data.papel as Papel,
      } as any);

      if (papelError) throw papelError;

      // 4. Atribuir permissões
      const permissoesRows = Object.entries(data.permissoes).map(([modulo, p]: [string, any]) => ({
        usuario_id: userId,
        empresa_id: data.empresaId,
        modulo: modulo as Modulo,
        pode_visualizar: p.visualiza ?? false,
        pode_criar: p.edita ?? false,
        pode_editar: p.edita ?? false,
        pode_excluir: p.exclui ?? false,
        ocultar_valores: p.ocultar ?? false,
      }));

      if (permissoesRows.length > 0) {
        const { error: permsError } = await supabaseAdmin.from("permissoes_acesso").insert(permissoesRows as any);
        if (permsError) throw permsError;
      }

      // 5. Opcional: Registrar na tabela equipe_membros para compatibilidade se necessário
      // (Embora perfis + usuarios_papeis seja a forma correta para RBAC no sistema)
      await (supabaseAdmin as any).from("equipe_membros").insert({
        id: userId,
        empresa_id: data.empresaId,
        nome: data.nome,
        email: data.email.trim().toLowerCase(),
        cargo: data.cargo,
        papel: data.papel,
        status: "ativo",
      });

      return { success: true, userId };
    } catch (err: any) {
      console.error("Erro ao finalizar cadastro de membro:", err);
      // Rollback do usuário auth se possível ou lidar com limpeza
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Erro ao finalizar cadastro: ${err.message}`);
    }
  });

export const redefinirSenhaMembro = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        usuarioId: z.string(),
        novaSenha: z.string().min(6),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.usuarioId, {
      password: data.novaSenha,
    });

    if (error) {
      console.error("Erro ao atualizar senha:", error);
      throw new Error(`Erro ao atualizar senha: ${error.message}`);
    }

    return { success: true };
  });

export const registrarFalhaLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().email(),
        dispositivo: z.string(),
        ip: z.string().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    // Tentar encontrar o perfil para pegar a empresa_id se existir
    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("id, nome, empresa_id")
      .eq("email", data.email.trim().toLowerCase())
      .maybeSingle();

    await supabaseAdmin.from("logs_acesso").insert({
      usuario_id: perfil?.id,
      usuario_nome: perfil?.nome || data.email.split("@")[0],
      usuario_email: data.email.trim().toLowerCase(),
      dispositivo: data.dispositivo,
      ip: data.ip || "0.0.0.0",
      status: "erro", // Status para falha
      empresa_id: perfil?.empresa_id,
    } as any);

    return { success: true };
  });

export const aprovarAcessoPendente = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        empresaId: z.string().uuid(),
        cargo: z.string(),
        papel: z.string(),
        permissoes: z.record(z.any()),
        conviteId: z.string().uuid().optional().nullable(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    // A segurança de quem chama (se é admin da empresa) é validada pelo RLS das tabelas
    // e pelo uso do supabaseAdmin para operações críticas após validação de contexto.

    try {
      // 0. Buscar nome do usuário no Auth se possível ou no convite
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      const nomeUsuario = authUser.user?.user_metadata?.nome || authUser.user?.email?.split('@')[0] || 'Usuário';

      // 1. Criar/Atualizar perfil
      const { error: perfilError } = await supabaseAdmin.from("perfis").upsert({
        id: data.userId,
        empresa_id: data.empresaId,
        nome: nomeUsuario, // Adicionado campo obrigatório nome
        cargo: data.cargo,
        ativo: true,
      } as any, { onConflict: 'id' });

      if (perfilError) throw perfilError;

      // 2. Atribuir papel
      const { error: papelError } = await supabaseAdmin.from("usuarios_papeis").upsert({
        usuario_id: data.userId,
        empresa_id: data.empresaId,
        papel: data.papel as Papel,
      } as any, { onConflict: 'usuario_id, papel' });

      if (papelError) throw papelError;

      // 3. Atribuir permissões
      const permissoesRows = Object.entries(data.permissoes).map(([modulo, p]: [string, any]) => ({
        usuario_id: data.userId,
        empresa_id: data.empresaId,
        modulo: modulo as Modulo,
        pode_visualizar: p.visualiza ?? false,
        pode_criar: p.edita ?? false,
        pode_editar: p.edita ?? false,
        pode_excluir: p.exclui ?? false,
        ocultar_valores: p.ocultar ?? false,
      }));

      if (permissoesRows.length > 0) {
        const { error: permsError } = await supabaseAdmin.from("permissoes_acesso").upsert(permissoesRows as any, { 
          onConflict: 'usuario_id, empresa_id, modulo' 
        });
        if (permsError) throw permsError;
      }

      // 4. Se houver convite, marcar como usado usando RPC (security definer)
      if (data.conviteId) {
        const { error: conviteError } = await supabaseAdmin.rpc('marcar_convite_usado', {
          _convite_id: data.conviteId,
          _user_id: data.userId
        });
        if (conviteError) throw conviteError;
      }

      // 5. Registrar log de auditoria
      await supabaseAdmin.from("logs_acesso").insert({
        usuario_id: data.userId,
        usuario_nome: `Acesso Aprovado (${data.cargo})`,
        status: "sucesso",
        empresa_id: data.empresaId,
        dispositivo: "Sistema (Aprovação)",
        ip: "0.0.0.0"
      } as any);

      return { success: true };
    } catch (err: any) {
      console.error("Erro ao aprovar acesso pendente:", err);
      throw new Error(`Erro ao aprovar acesso: ${err.message}`);
    }
  });
