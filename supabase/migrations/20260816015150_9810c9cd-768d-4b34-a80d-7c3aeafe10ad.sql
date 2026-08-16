DO $$
DECLARE v_user uuid; v_empresa uuid;
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = 'teixeiraligya@gmail.com' LIMIT 1;
  IF v_user IS NULL THEN RETURN; END IF;

  SELECT empresa_id INTO v_empresa FROM public.perfis WHERE id = v_user;

  IF v_empresa IS NULL THEN
    INSERT INTO public.empresas (razao_social, nome_fantasia)
    VALUES ('Minha Empresa', 'Minha Empresa') RETURNING id INTO v_empresa;

    INSERT INTO public.perfis (id, empresa_id, nome, email, cargo)
    VALUES (v_user, v_empresa, 'Ligya Teixeira', 'teixeiraligya@gmail.com', 'Administrador')
    ON CONFLICT (id) DO UPDATE SET empresa_id = EXCLUDED.empresa_id, cargo = 'Administrador', ativo = true;
  ELSE
    UPDATE public.perfis SET cargo = 'Administrador', ativo = true WHERE id = v_user;
  END IF;

  INSERT INTO public.usuarios_papeis (usuario_id, papel, empresa_id)
  SELECT v_user, p.papel, v_empresa
  FROM (VALUES ('administrador'::app_role), ('gestor'::app_role)) AS p(papel)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.usuarios_papeis up
    WHERE up.usuario_id = v_user AND up.papel = p.papel AND up.empresa_id = v_empresa
  );
END $$;