DO $$
DECLARE
    v_empresa_id uuid;
BEGIN
    SELECT id INTO v_empresa_id FROM public.empresas LIMIT 1;

    IF v_empresa_id IS NOT NULL THEN
        -- Primeiro desativamos as que não são as solicitadas para manter a lista limpa
        UPDATE public.modalidades_bm 
        SET ativo = false 
        WHERE empresa_id = v_empresa_id 
          AND nome NOT IN ('Conta 250', 'Conta 2K', 'Conta 10K', 'Conta 100K');

        -- Inserimos ou reativamos as solicitadas
        INSERT INTO public.modalidades_bm (empresa_id, nome, codigo, preco_venda_padrao, ativo)
        VALUES 
            (v_empresa_id, 'Conta 250', 'C250', 0, true),
            (v_empresa_id, 'Conta 2K', 'C2K', 0, true),
            (v_empresa_id, 'Conta 10K', 'C10K', 0, true),
            (v_empresa_id, 'Conta 100K', 'C100K', 0, true)
        ON CONFLICT (empresa_id, codigo) DO UPDATE 
        SET nome = EXCLUDED.nome, ativo = true;
    END IF;
END $$;