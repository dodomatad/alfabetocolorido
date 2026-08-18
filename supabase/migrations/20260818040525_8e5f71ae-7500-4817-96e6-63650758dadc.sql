-- 1. Garantir que o enum app_role exista
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('administrador','gestor','financeiro','supervisor_producao','funcionario','visualizacao');
    END IF;
END $$;

-- 2. Criar a função has_role que aceita TEXT para evitar o erro de tipagem "unknown" do RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios_papeis 
    WHERE usuario_id = _user_id 
      AND papel::text = _role
  );
$$;

-- 3. Criar a versão que aceita o ENUM explicitamente
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, _role::text);
$$;

-- 4. Dar as permissões necessárias
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 5. Garantir que a função pode_gerenciar também esteja no public e funcionando
CREATE OR REPLACE FUNCTION public.pode_gerenciar()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'gestor');
$$;

GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO authenticated, service_role;
