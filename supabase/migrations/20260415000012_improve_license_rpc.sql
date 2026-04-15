-- Migration: improve activate_license_key error messages
-- Distinguishes "key not found" from "key already used"

CREATE OR REPLACE FUNCTION public.activate_license_key(p_key_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key  license_keys%ROWTYPE;
  v_user users%ROWTYPE;
  v_base timestamptz;
  v_new_expiry timestamptz;
BEGIN
  -- Check if key exists at all (used or not)
  SELECT * INTO v_key
  FROM license_keys
  WHERE UPPER(key_code) = UPPER(p_key_code);

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Clé introuvable');
  END IF;

  -- Key exists but already used
  IF v_key.is_used THEN
    RETURN json_build_object('error', 'Cette clé a déjà été utilisée');
  END IF;

  -- Look up caller's profile
  SELECT * INTO v_user FROM users WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Profil utilisateur introuvable');
  END IF;

  -- Compute cumulative expiration
  IF v_user.licence_expiration IS NOT NULL AND v_user.licence_expiration > now() THEN
    v_base := v_user.licence_expiration;
  ELSE
    v_base := now();
  END IF;
  v_new_expiry := v_base + (v_key.duration_months || ' months')::interval;

  -- Upgrade user
  UPDATE users
  SET role = v_key.type,
      licence_expiration = v_new_expiry,
      updated_at = now()
  WHERE user_id = auth.uid();

  -- Mark key consumed
  UPDATE license_keys
  SET is_used  = true,
      used_by  = v_user.id,
      used_at  = now()
  WHERE id = v_key.id;

  RETURN json_build_object(
    'success',    true,
    'type',       v_key.type,
    'expires_at', v_new_expiry
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_license_key(text) TO authenticated;
