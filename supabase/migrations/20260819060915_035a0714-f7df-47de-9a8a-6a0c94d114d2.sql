REVOKE ALL ON FUNCTION public.onboarding_novo_usuario(TEXT) FROM public;
REVOKE ALL ON FUNCTION public.onboarding_novo_usuario(TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.onboarding_novo_usuario(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.onboarding_novo_usuario(TEXT) TO service_role;