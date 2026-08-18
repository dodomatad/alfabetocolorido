import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const registrarLogAcesso = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        usuarioId: z.string(),
        usuarioNome: z.string(),
        dispositivo: z.string(),
        ip: z.string().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Buscamos o perfil para pegar a empresa_id
    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("empresa_id")
      .eq("id", data.usuarioId)
      .single();

    const { error } = await supabaseAdmin.from("logs_acesso").insert({
      usuario_id: data.usuarioId,
      usuario_nome: data.usuarioNome,
      dispositivo: data.dispositivo,
      ip: data.ip || "0.0.0.0",
      status: "ativo",
      empresa_id: perfil?.empresa_id,
    } as any);

    if (error) {
      console.error("Erro ao registrar log de acesso no servidor:", error);
      throw error;
    }

    return { success: true };
  });
