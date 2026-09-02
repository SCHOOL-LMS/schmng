CREATE TABLE public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number text UNIQUE,
  student_name text NOT NULL,
  dob date,
  place_of_birth text,
  class_admitted text NOT NULL,
  previous_school text,
  previous_class text,
  last_attendance date,
  reason_for_leaving text,
  disability_status text NOT NULL DEFAULT 'No',
  disability_type text,
  assistance_needed text,
  gender text NOT NULL DEFAULT 'Other',
  parent_name text NOT NULL,
  relationship text,
  parent_phone text,
  alt_contact text,
  hometown text,
  hometown_district text,
  residence text,
  residence_district text,
  parent_email text NOT NULL,
  emergency_name text,
  emergency_phone text,
  emergency_relationship text,
  emergency_residence text,
  emergency_residence_district text,
  address text,
  city text,
  community text,
  digital_address text,
  status text NOT NULL DEFAULT 'admitted',
  student_profile_id uuid,
  parent_profile_id uuid,
  student_login_email text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.assign_admission_row_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.admission_number IS NULL OR NEW.admission_number = '' THEN
    NEW.admission_number := 'ADM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.admission_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER admissions_number BEFORE INSERT ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.assign_admission_row_number();
CREATE TRIGGER admissions_updated_at BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX admissions_parent_email_idx ON public.admissions (lower(parent_email));
CREATE INDEX admissions_parent_profile_idx ON public.admissions (parent_profile_id);
CREATE INDEX admissions_student_profile_idx ON public.admissions (student_profile_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admissions TO authenticated;
GRANT ALL ON public.admissions TO service_role;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage admissions" ON public.admissions FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "staff read admissions" ON public.admissions FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "family reads own admissions" ON public.admissions FOR SELECT TO authenticated
  USING (parent_profile_id = auth.uid() OR student_profile_id = auth.uid());

CREATE OR REPLACE FUNCTION private.owns_admission(_admission_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admissions a
    WHERE a.id = _admission_id
      AND (a.parent_profile_id = auth.uid() OR a.student_profile_id = auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION private.owns_admission(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.owns_admission(uuid) TO authenticated, service_role;

CREATE TABLE public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL UNIQUE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  teacher_name text NOT NULL DEFAULT '',
  teacher_email text NOT NULL DEFAULT '',
  teacher_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER class_teachers_updated_at BEFORE UPDATE ON public.class_teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_teachers TO authenticated;
GRANT ALL ON public.class_teachers TO service_role;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read class teachers" ON public.class_teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage class teachers" ON public.class_teachers FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

CREATE TABLE public.student_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  term text NOT NULL,
  subject text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT '',
  assessment_type text NOT NULL DEFAULT 'exam',
  remarks text NOT NULL DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_performance TO authenticated;
GRANT ALL ON public.student_performance TO service_role;
ALTER TABLE public.student_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage performance" ON public.student_performance FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "family reads performance" ON public.student_performance FOR SELECT TO authenticated
  USING (private.owns_admission(admission_id) OR private.has_role(auth.uid(), 'staff'::app_role));

CREATE TABLE public.student_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admission_id, attendance_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_attendance TO authenticated;
GRANT ALL ON public.student_attendance TO service_role;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage attendance" ON public.student_attendance FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "family reads attendance" ON public.student_attendance FOR SELECT TO authenticated
  USING (private.owns_admission(admission_id) OR private.has_role(auth.uid(), 'staff'::app_role));

CREATE TABLE public.student_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  term text NOT NULL,
  amount_due numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  due_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER student_fees_updated_at BEFORE UPDATE ON public.student_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_fees TO authenticated;
GRANT ALL ON public.student_fees TO service_role;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage fees" ON public.student_fees FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "family reads fees" ON public.student_fees FOR SELECT TO authenticated
  USING (private.owns_admission(admission_id));

CREATE TABLE public.student_exeat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_school',
  reason text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  signed_by_name text NOT NULL DEFAULT '',
  signed_by_id uuid,
  departed_at timestamptz,
  return_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER student_exeat_updated_at BEFORE UPDATE ON public.student_exeat
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX student_exeat_admission_idx ON public.student_exeat (admission_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_exeat TO authenticated;
GRANT ALL ON public.student_exeat TO service_role;
ALTER TABLE public.student_exeat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage exeat" ON public.student_exeat FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "staff manage exeat" ON public.student_exeat FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "family reads exeat" ON public.student_exeat FOR SELECT TO authenticated
  USING (private.owns_admission(admission_id));