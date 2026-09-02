CREATE SEQUENCE IF NOT EXISTS public.admission_number_seq;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admission_number text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_admission_number_key ON public.profiles (admission_number) WHERE admission_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_admission_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = 'student' AND (NEW.admission_number IS NULL OR NEW.admission_number = '') THEN
    NEW.admission_number := 'ADM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.admission_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_admission_number ON public.profiles;
CREATE TRIGGER profiles_admission_number
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_admission_number();

UPDATE public.profiles
SET admission_number = 'ADM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.admission_number_seq')::text, 4, '0')
WHERE role = 'student' AND (admission_number IS NULL OR admission_number = '');