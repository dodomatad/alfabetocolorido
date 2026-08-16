import { supabase } from '@/integrations/supabase/client'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const redefinirSenhaAdmin = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({
    usuarioId: z.string(),
    novaSenha: z.string().min(6),
    empresaId: z.string(),
    forcarTroca: z.boolean().default(false)
  }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    
    // 1. Atualizar a senha no auth do Supabase
    const { error: errorAuth } = await supabaseAdmin.auth.admin.updateUserById(
      data.usuarioId,
      { password: data.novaSenha }
    )
    
    if (errorAuth) throw errorAuth

    // 2. Registrar log de auditoria
    await supabaseAdmin.from('auditoria_eventos').insert({
      empresa_id: data.empresaId,
      entidade: 'auth.users',
      entidade_id: data.usuarioId,
      acao: 'alteracao_senha_admin',
      dados_novos: { forcar_troca: data.forcarTroca }
    } as any)

    return { success: true }
  })
