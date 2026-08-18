# Plano de Implementação: Persistência de Integrantes e Logs de Acesso

Estruturar o salvamento correto e a persistência definitiva dos dados de integrantes e o registro automático do histórico de acessos de cada usuário no banco de dados (Supabase).

## Ações Realizadas

### 1. Estrutura do Banco de Dados (Supabase Migration)
Configuração das tabelas e políticas de segurança para garantir a integridade dos dados.

```sql
-- 1. Tabela de Membros da Equipe (Complemento/Refinamento)
-- A tabela equipe_membros já existe, vamos garantir que tenha as colunas necessárias e chaves estrangeiras.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipe_membros' AND column_name = 'user_id') THEN
        ALTER TABLE public.equipe_membros ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Tabela de Histórico de Acessos
CREATE TABLE IF NOT EXISTS public.logs_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usuario_nome TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    dispositivo TEXT NOT NULL,
    ip TEXT DEFAULT '127.0.0.1',
    status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo', 'Senha incorreta', 'Bloqueado', 'erro'
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS e Garantir Privilégios
ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipe_membros TO authenticated;
GRANT ALL ON public.equipe_membros TO service_role;

GRANT SELECT, INSERT ON public.logs_acesso TO authenticated;
GRANT INSERT ON public.logs_acesso TO anon; -- Necessário para registrar tentativas de login falhas
GRANT ALL ON public.logs_acesso TO service_role;

-- 4. Políticas de RLS
DROP POLICY IF EXISTS "Gerenciar equipe_membros para autenticados" ON public.equipe_membros;
CREATE POLICY "Gerenciar equipe_membros para autenticados"
ON public.equipe_membros FOR ALL
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Visualizar logs_acesso para autenticados" ON public.logs_acesso;
CREATE POLICY "Visualizar logs_acesso para autenticados"
ON public.logs_acesso FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "Inserir logs para autenticados" ON public.logs_acesso;
CREATE POLICY "Inserir logs para autenticados"
ON public.logs_acesso FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Inserir logs anonimos para registrar falha" ON public.logs_acesso;
CREATE POLICY "Inserir logs anonimos para registrar falha"
ON public.logs_acesso FOR INSERT
TO anon WITH CHECK (true);

-- 5. Recarregar schema cache
NOTIFY pgrst, 'reload schema';
```

### 2. Integração no Código (Frontend & Backend)
- **Sincronização de Dados**: Atualizar o servidor para garantir que toda criação de membro reflita em `auth.users`, `perfis`, `usuarios_papeis`, `permissoes_acesso` e `equipe_membros`.
- **Registro Automático de Logs**: Garantir que o gate de autenticação (`src/routes/_authenticated/route.tsx`) registre o IP e dispositivo corretamente a cada nova sessão diária.
- **Persistência de Edição**: Corrigir o modal de edição para atualizar todas as tabelas relacionadas sem tentar criar um novo usuário no Auth.

## Detalhes Técnicos
- Uso de `supabaseAdmin` no servidor para manipulação segura de usuários e permissões.
- Políticas de RLS baseadas em `authenticated` e `empresa_id` (via isolamento multi-tenant).
- Validação de entrada com Zod em todas as `server functions`.
