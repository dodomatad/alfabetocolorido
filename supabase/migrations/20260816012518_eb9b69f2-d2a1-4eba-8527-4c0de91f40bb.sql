DO $$
DECLARE r record; v_empresa uuid;
BEGIN
  FOR r IN SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'nome', u.email) AS nome
           FROM auth.users u
           LEFT JOIN public.perfis p ON p.id = u.id
           WHERE p.id IS NULL OR p.empresa_id IS NULL
  LOOP
    INSERT INTO public.empresas (razao_social, nome_fantasia)
    VALUES ('Minha Empresa', 'Minha Empresa') RETURNING id INTO v_empresa;

    INSERT INTO public.perfis (id, empresa_id, nome, email, cargo)
    VALUES (r.id, v_empresa, r.nome, r.email, 'Administrador')
    ON CONFLICT (id) DO UPDATE SET empresa_id = EXCLUDED.empresa_id;

    INSERT INTO public.usuarios_papeis (usuario_id, papel, empresa_id)
    VALUES (r.id, 'administrador', v_empresa)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;