-- 1. Criar Tipos e Enums Necessários
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entrega_status') THEN
        CREATE TYPE public.entrega_status AS ENUM ('pendente', 'em_rota', 'entregue', 'falhou', 'cancelada');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financeiro_situacao') THEN
        CREATE TYPE public.financeiro_situacao AS ENUM ('aberto', 'pago', 'atrasado', 'cancelado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financeiro_tipo') THEN
        CREATE TYPE public.financeiro_tipo AS ENUM ('receber', 'pagar');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'motivo_queda') THEN
        CREATE TYPE public.motivo_queda AS ENUM ('erro_cartao', 'checkpoint_identidade', 'bloqueio_ip', 'restricao_imediata', 'outros');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar a tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Função has_role (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Função proximo_numero_venda
CREATE OR REPLACE FUNCTION public.proximo_numero_venda(_empresa uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    proximo integer;
BEGIN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO proximo
    FROM public.vendas
    WHERE empresa_id = _empresa;
    
    RETURN proximo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.proximo_numero_venda(uuid) TO service_role;

-- 5. Grants nas tabelas existentes (Garantir acesso do frontend)
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END LOOP;
END $$;
