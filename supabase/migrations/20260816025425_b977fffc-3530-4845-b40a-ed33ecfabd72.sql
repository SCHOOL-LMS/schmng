ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS employee_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS salary numeric(12,2),
  ADD COLUMN IF NOT EXISTS start_date date;

CREATE SEQUENCE IF NOT EXISTS public.employee_id_seq START 1;

CREATE OR REPLACE FUNCTION public.assign_employee_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('staff','school_manager') AND (NEW.employee_id IS NULL OR NEW.employee_id = '') THEN
    NEW.employee_id := 'EMP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.employee_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_employee_id ON public.profiles;
CREATE TRIGGER profiles_employee_id
BEFORE INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_employee_id();

CREATE TABLE public.staff_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_period text NOT NULL,
  rating text NOT NULL,
  rating_score integer NOT NULL DEFAULT 3,
  comments text NOT NULL DEFAULT '',
  reviewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_performance TO authenticated;
GRANT ALL ON public.staff_performance TO service_role;
ALTER TABLE public.staff_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff performance readable by self or admins" ON public.staff_performance
  FOR SELECT TO authenticated USING (staff_id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "admins manage staff performance" ON public.staff_performance
  FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE TRIGGER staff_performance_updated_at BEFORE UPDATE ON public.staff_performance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  schedule_type text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_schedules TO authenticated;
GRANT ALL ON public.staff_schedules TO service_role;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules readable by self or admins" ON public.staff_schedules
  FOR SELECT TO authenticated USING (staff_id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "admins manage schedules" ON public.staff_schedules
  FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE TRIGGER staff_schedules_updated_at BEFORE UPDATE ON public.staff_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.offer_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name text NOT NULL,
  candidate_email text NOT NULL,
  position text NOT NULL,
  salary numeric(12,2) NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letters TO authenticated;
GRANT ALL ON public.offer_letters TO service_role;
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read offer letters" ON public.offer_letters
  FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
CREATE POLICY "admins manage offer letters" ON public.offer_letters
  FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE TRIGGER offer_letters_updated_at BEFORE UPDATE ON public.offer_letters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();