-- Add ip_address column to activity_logs
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Function to extract client IP from PostgREST request headers
CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  headers JSONB;
  ip TEXT;
BEGIN
  BEGIN
    headers := current_setting('request.headers', true)::JSONB;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  -- Try headers in priority order
  ip := headers->>'cf-connecting-ip';
  IF ip IS NOT NULL AND ip <> '' THEN RETURN ip; END IF;

  ip := headers->>'x-real-ip';
  IF ip IS NOT NULL AND ip <> '' THEN RETURN ip; END IF;

  ip := headers->>'x-forwarded-for';
  IF ip IS NOT NULL AND ip <> '' THEN
    -- x-forwarded-for can be a comma-separated list; take the first IP
    RETURN split_part(ip, ',', 1);
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_ip() TO authenticated, anon;
