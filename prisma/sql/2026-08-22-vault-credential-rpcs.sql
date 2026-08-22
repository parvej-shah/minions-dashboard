-- Create RPC functions for Supabase Vault interaction

CREATE OR REPLACE FUNCTION public.create_channel_secret(secret text, name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  SELECT vault.create_secret(secret, name, 'Channel credential') INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_channel_secret(secret_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_val text;
BEGIN
  SELECT decrypted_secret INTO secret_val FROM vault.decrypted_secrets WHERE id = secret_id;
  RETURN secret_val;
END;
$$;

-- Secure the functions so only the service_role (which getSupabaseAdmin() uses) can call them
REVOKE EXECUTE ON FUNCTION public.create_channel_secret(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_channel_secret(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_channel_secret(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_channel_secret(uuid) TO service_role;

-- Reload schema cache just in case PostgREST needs it
NOTIFY pgrst, 'reload schema';
