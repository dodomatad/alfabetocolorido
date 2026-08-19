-- 1. Converter a coluna 'status' da tabela 'entregas' de ENUM para TEXT
ALTER TABLE public.entregas 
ALTER COLUMN status TYPE TEXT USING status::text;

-- 2. Garantir que a coluna 'status_entrega' na tabela 'vendas' também seja TEXT
ALTER TABLE public.vendas 
ALTER COLUMN status_entrega TYPE TEXT USING status_entrega::text;

-- 3. Atualizar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';