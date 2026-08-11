CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','school_manager')) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;

DROP POLICY "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
USING ((id = auth.uid()) OR private.is_admin(auth.uid()));

DROP POLICY "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
USING ((id = auth.uid()) OR private.is_admin(auth.uid()))
WITH CHECK ((id = auth.uid()) OR private.is_admin(auth.uid()));

DROP POLICY "admins insert profiles" ON public.profiles;
CREATE POLICY "admins insert profiles" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY "super admins delete profiles" ON public.profiles;
CREATE POLICY "super admins delete profiles" ON public.profiles FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR private.is_admin(auth.uid()));

DROP POLICY "admins read reset requests" ON public.password_reset_requests;
CREATE POLICY "admins read reset requests" ON public.password_reset_requests FOR SELECT TO authenticated
USING (private.is_admin(auth.uid()));

DROP POLICY "admins update reset requests" ON public.password_reset_requests;
CREATE POLICY "admins update reset requests" ON public.password_reset_requests FOR UPDATE TO authenticated
USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_admin(uuid);