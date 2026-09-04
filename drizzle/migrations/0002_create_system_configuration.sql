-- Multi-tenant catalogue: schools, education levels, school types, subjects,
-- per-tenant policy settings and per-school branding.

CREATE TABLE public.school_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.education_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 1,
  min_age integer,
  max_age integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  country text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'UTC',
  currency text NOT NULL DEFAULT 'USD',
  locale text NOT NULL DEFAULT 'en-US',
  type_code text NOT NULL DEFAULT 'private',
  level_codes text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  level_code text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  credits numeric,
  elective boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, level_code, code)
);

CREATE TABLE public.tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  positions text[] NOT NULL DEFAULT '{}',
  departments text[] NOT NULL DEFAULT '{}',
  rating_scale jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule_types text[] NOT NULL DEFAULT '{}',
  grading_system text NOT NULL DEFAULT 'letter',
  academic_year_start_month integer NOT NULL DEFAULT 9,
  week_starts_on text NOT NULL DEFAULT 'monday',
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_settings_grading_chk CHECK (grading_system IN ('letter','percentage','gpa','points')),
  CONSTRAINT tenant_settings_week_chk CHECK (week_starts_on IN ('monday','sunday')),
  CONSTRAINT tenant_settings_month_chk CHECK (academic_year_start_month BETWEEN 1 AND 12)
);

CREATE TABLE public.school_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#2f6f8f',
  accent_color text NOT NULL DEFAULT '#d9a441',
  language text NOT NULL DEFAULT 'en',
  currency text NOT NULL DEFAULT 'USD',
  locale text NOT NULL DEFAULT 'en-US',
  date_format text NOT NULL DEFAULT 'dmy',
  show_powered_by boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_branding_date_chk CHECK (date_format IN ('dmy','mdy','ymd'))
);

GRANT SELECT ON public.school_types TO authenticated;
GRANT SELECT ON public.education_levels TO authenticated;
GRANT SELECT ON public.schools TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.tenant_settings TO authenticated;
GRANT SELECT ON public.school_branding TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.school_types, public.education_levels, public.schools,
  public.subjects, public.tenant_settings, public.school_branding TO authenticated;
GRANT ALL ON public.school_types, public.education_levels, public.schools,
  public.subjects, public.tenant_settings, public.school_branding TO service_role;

ALTER TABLE public.school_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config read" ON public.school_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "config read" ON public.education_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "config read" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "config read" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "config read" ON public.tenant_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "config read" ON public.school_branding FOR SELECT TO authenticated USING (true);

CREATE POLICY "super admin all" ON public.school_types FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "super admin all" ON public.education_levels FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "super admin all" ON public.schools FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "super admin all" ON public.subjects FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "super admin all" ON public.tenant_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "super admin all" ON public.school_branding FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER school_types_updated_at BEFORE UPDATE ON public.school_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER education_levels_updated_at BEFORE UPDATE ON public.education_levels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tenant_settings_updated_at BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER school_branding_updated_at BEFORE UPDATE ON public.school_branding FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.school_types (code, name, description) VALUES
  ('public','Public / Government','State funded, national curriculum.'),
  ('private','Private / Independent','Privately funded, own fee structure.'),
  ('international','International','IB, Cambridge or multi-curriculum.'),
  ('faith','Faith-based','Mission or religious foundation.'),
  ('special','Special Needs','Inclusive and assisted learning.'),
  ('online','Online / Virtual','Fully remote delivery.'),
  ('vocational','Vocational Institute','Skills and trade certification.');

INSERT INTO public.education_levels (code, name, sort_order, min_age, max_age) VALUES
  ('early-years','Early Years / Nursery',1,2,5),
  ('primary','Primary / Elementary',2,6,11),
  ('junior-secondary','Junior Secondary / Middle',3,12,14),
  ('senior-secondary','Senior Secondary / High',4,15,18),
  ('tvet','Technical & Vocational (TVET)',5,NULL,NULL),
  ('tertiary','Tertiary / University',6,NULL,NULL),
  ('continuing','Continuing & Professional Education',7,NULL,NULL);
